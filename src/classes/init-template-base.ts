/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2021-2026 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/license/mit.
 */

// ----------------------------------------------------------------------------

import assert from 'node:assert'
import * as util from 'node:util'
import * as readline from 'node:readline/promises'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'

// https://www.npmjs.com/package/liquidjs
import { Liquid, LiquidOptions } from 'liquidjs'

import { Logger } from '@xpack/logger'

// ----------------------------------------------------------------------------

import {
  InitTemplateItemValue,
  InitTemplatePropertiesDefinitions,
  InitTemplateSubstitutionsVariables,
} from '../types/xpm-init-template.js'
import { Context } from '../types/xpm.js'
import {
  isString,
  isObject,
  isBoolean,
  isNumber,
} from '../functions/is-something.js'
import {
  JsonSyntaxError,
  InputError,
  OutputError,
  ConfigurationError,
} from './errors.js'
import { LiquidEngine } from './liquid-engine.js'
import { liquidSubstitutionsVariablesBase } from '../data/substitutions-variables.js'
import type { Policies } from './policies.js'

// ============================================================================

/**
 * Configuration parameters for constructing an `xpm init` template.
 *
 * @remarks
 * This interface defines the required configuration for creating an
 * instance of {@link InitTemplateBase} or its derived classes. All
 * properties are mandatory except for the optional `process` parameter,
 * parameter, which defaults to the global Node.js `process` object when
 * not specified.
 *
 * The parameters provide the template with access to the <b>xpm</b>
 * context, file system paths, property definitions, and the process
 * environment necessary for template operations.
 */
export interface InitTemplateConstructorParameters {
  /**
   * The <b>xpm</b> context containing configuration and logging utilities.
   */
  context: Context

  /**
   * The absolute path to the templates folder.
   */
  templatesFolderPath: string

  /**
   * Definitions of all properties supported by this template.
   */
  propertiesDefinitions: InitTemplatePropertiesDefinitions

  /**
   * The Node.js process object (defaults to the global `process`).
   * Intended for testing purposes to allow mocking of process properties
   * and methods.
   */
  process?: NodeJS.Process

  /**
   * Optional configuration options for the Liquid templating engine.
   *
   * @remarks
   * These options customise the behaviour of the Liquid template engine
   * used for rendering template files. The options are merged with the
   * required `root` property (set to `templatesPath`) when initialising
   * the engine. Common options include `strictFilters`,
   * `strictVariables`, and `trimOutputLeft`/`trimOutputRight` for
   * controlling whitespace handling.
   *
   * Refer to the Liquid documentation for the complete list of available
   * configuration options:
   * \<https://liquidjs.com/tutorials/options.html\>
   */
  options?: LiquidOptions

  /**
   * The policy flags instance that governs template behaviour.
   *
   * @remarks
   * The `Policies` instance encapsulates compatibility flags derived
   * from the minimum required <b>xpm</b> version declared by the
   * package being initialised. These flags control how the template
   * builds its substitution variables:
   *
   * <ul>
   * <li>When <code>Policies.topPropertiesXpmInitTemplate</code> is
   *    <code>true</code> (legacy, <b>xpm</b> \< 0.23.0), configuration
   *    properties are spread at the top level of
   *    <code>substitutionsVariables</code> for direct access in
   *    templates.</li>
   * <li>When <code>Policies.topPropertiesXpmInitTemplate</code> is
   *    <code>false</code> (modern, <b>xpm</b> \>= 0.23.0),
   *    configuration properties are grouped under
   *    <code>substitutionsVariables.matrix</code>, and base variables
   *    from <code>liquidSubstitutionsVariablesBase</code> are merged into
   *    <code>substitutionsVariables.properties</code>.</li>
   * </ul>
   */
  policies: Policies
}

/**
 * Base class for `xpm init` templates.
 *
 * @remarks
 * This abstract class provides the foundation for template-based project
 * initialisation. It handles the complete workflow: property validation,
 * interactive user prompts for missing mandatory values, variable
 * substitution, and file generation using the Liquid templating engine.
 *
 * Template workflow:
 *
 * <ol>
 * <li>Properties are validated against their definitions</li>
 * <li>Missing mandatory properties trigger interactive prompts (if TTY)</li>
 * <li>Substitution variables are prepared from properties</li>
 * <li>The <code>InitTemplateBase.generate()</code> method creates project
 * files</li>
 * </ol>
 *
 * Derived classes must implement {@link InitTemplateBase.generate}
 * to define the specific files and folder structure to create.
 */
export abstract class InitTemplateBase {
  // --------------------------------------------------------------------------
  // Public Members.

  // --------------------------------------------------------------------------
  // Protected Members.

  /**
   * The <b>xpm</b> context containing configuration and logging utilities.
   */
  readonly context: Context

  /**
   * The logger instance for output and diagnostics.
   */
  readonly log: Logger

  /**
   * Definitions of all properties supported by this template.
   */
  readonly propertiesDefinitions: InitTemplatePropertiesDefinitions = {}

  /**
   * The absolute path to the templates folder.
   */
  readonly templatesFolderPath: string

  /**
   * The Liquid templating engine instance.
   */
  readonly engine: Liquid

  /**
   * The variables to be used for template substitutions.
   */
  substitutionsVariables?: InitTemplateSubstitutionsVariables

  /**
   * Flag indicating whether the template is running in interactive mode.
   *
   * @remarks
   * This flag determines whether the template execution involved user
   * interaction through terminal prompts for missing mandatory property
   * values.
   *
   * State management:
   *
   * <ol>
   * <li>Initialised to <code>false</code> upon construction.</li>
   * <li>Set to <code>true</code> in {@link InitTemplateBase.run} if at least
   *    one mandatory property was missing and required interactive
   *    prompting.</li>
   * <li>Set to <code>false</code> if all mandatory properties were provided
   *    via command-line options.</li>
   * </ol>
   *
   * When interactive mode is activated, the context start time is reset
   * after user input to exclude interactive time from performance metrics,
   * ensuring accurate measurement of the template processing duration.
   */
  isInteractive = false

  /**
   * The Node.js process object for accessing runtime environment information.
   *
   * @remarks
   * This reference provides access to process properties including standard
   * I/O streams, platform information, and architecture details. It is
   * configurable via the constructor to support testing scenarios where
   * process properties need to be mocked or controlled.
   *
   * Usage within the template:
   *
   * <ol>
   * <li>Platform detection via <code>process.platform</code> and
   *    <code>process.arch</code> for
   *    platform-specific property validation.</li>
   * <li>TTY detection via <code>stdin.isTTY</code> and
   *    <code>stdout.isTTY</code> to determine
   *    whether interactive prompting is possible.</li>
   * <li>Standard I/O access for interactive user prompts and diagnostic
   *    output.</li>
   * </ol>
   *
   * Defaults to the global Node.js <code>process</code> object when not
   * explicitly provided in the constructor, enabling normal runtime
   * behaviour whilst allowing test environments to inject controlled
   * process implementations.
   */
  readonly process: NodeJS.Process

  /**
   * The policy flags instance that governs template behaviour.
   *
   * @remarks
   * Stores the {@link Policies} instance supplied via the constructor.
   * It is consulted in {@link InitTemplateBase.run} to determine
   * which substitution variable layout to build:
   *
   * <ul>
   * <li>Legacy layout (<code>Policies.topPropertiesXpmInitTemplate</code>
   *    is <code>true</code>): configuration properties are spread at the top
   *    level of <code>substitutionsVariables</code>.</li>
   * <li>Modern layout (<code>false</code>): configuration properties are
   *    placed under <code>substitutionsVariables.matrix</code>, and
   *    base variables from
   *    <code>liquidSubstitutionsVariablesBase</code> populate
   *    <code>substitutionsVariables.properties</code>.</li>
   * </ul>
   */
  policies: Policies

  // --------------------------------------------------------------------------
  // Constructor.

  /**
   * Constructs an `xpm init` template instance.
   *
   * @param context - The <b>xpm</b> context containing configuration and
   *    logging.
   * @param __dirname - The absolute path to the module folder.
   * @param templatesFolderPath - The absolute path to the templates folder.
   * @param propertiesDefinitions - The definitions of all supported properties.
   */
  constructor({
    context,
    templatesFolderPath,
    propertiesDefinitions,
    process: _process = process,
    options,
    policies,
  }: InitTemplateConstructorParameters) {
    assert(context, 'context is required')
    assert(context.log, 'context.log is required')
    assert(context.config, 'context.config is required')
    assert(context.config.projectName, 'context.config.projectName is required')
    assert(context.config.properties, 'context.config.properties is required')
    assert(context.rootPath, 'context.rootPath is required')
    assert(templatesFolderPath, 'templatesPath is required')
    assert(propertiesDefinitions, 'propertiesDefinitions is required')

    this.context = context
    this.log = context.log

    this.propertiesDefinitions = propertiesDefinitions
    this.templatesFolderPath = templatesFolderPath

    this.process = _process

    this.policies = policies

    this._validatePropertiesDefinitions()

    // https://liquidjs.com
    this.engine = new LiquidEngine({
      options: {
        ...options,
        root: this.templatesFolderPath,
      },
    })
  }

  // --------------------------------------------------------------------------
  // Public Methods.

  /**
   * Executes the template initialisation process.
   *
   * @remarks
   * This method orchestrates the complete template initialisation workflow.
   * It validates all provided properties, determines whether interactive
   * mode is required (when mandatory properties are missing), prompts for
   * missing values if in a TTY environment, prepares substitution variables
   * including the current year, and invokes the template-specific
   * {@link InitTemplateBase.generate} method to create project files.
   *
   * The method automatically applies default values to optional properties
   * that were not explicitly set. In interactive mode, the timer is reset
   * after user input to exclude interactive time from performance metrics.
   *
   * @returns A promise that resolves to 0 on success.
   *
   * @throws {@link JsonSyntaxError}
   * If property validation fails or interactive mode is required but not
   * available (non-TTY environment).
   */
  async run(): Promise<number> {
    const log = this.log
    log.trace(`${this.constructor.name}.run()`)

    log.info()

    const context = this.context
    const config = context.config

    assert(config.properties, 'config.properties is required')

    const validationErrors: string[] = []
    for (const [key, val] of Object.entries(config.properties)) {
      try {
        config.properties[key] = this.validatePropertyValue(key, val as string)
      } catch (error) {
        if (error instanceof Error) {
          const errorMessage = `${key}: ${error.message}`
          log.error(errorMessage)
          validationErrors.push(errorMessage)
        }
      }
    }
    if (validationErrors.length > 0) {
      throw new JsonSyntaxError(
        validationErrors.length === 1
          ? '1 invalid property'
          : `${String(validationErrors.length)} invalid properties`
      )
    }

    // Properties set by `--property name=value` are in `config.properties`.

    // If there is at least one mandatory property without an explicit value,
    // enter the interactive mode and ask for the missing values.

    const mustAsk = Object.entries(this.propertiesDefinitions).some(
      ([key, definition]) => {
        return definition.isMandatory && !config.properties?.[key]
      }
    )

    let isInteractive
    if (mustAsk) {
      // Need to ask for more values.
      if (!(this.process.stdin.isTTY && this.process.stdout.isTTY)) {
        throw new JsonSyntaxError(
          'Interactive mode not possible without a TTY.'
        )
      }

      await this._askForMoreValues()
      log.trace(util.inspect(config.properties))

      // Reset start time to skip interactive time.
      context.startTime = Date.now()
      isInteractive = true
    } else {
      // Properties without explicit values get their defaults.
      Object.entries(this.propertiesDefinitions).forEach(([key, val]) => {
        assert(config.properties, 'config.properties is required')
        if (!config.properties[key] && val.default !== undefined) {
          config.properties[key] = val.default
        }
      })
      isInteractive = false
    }

    this.isInteractive = isInteractive

    const currentTime = new Date()

    let substitutionsVariables: InitTemplateSubstitutionsVariables

    if (this.policies.topPropertiesXpmInitTemplate) {
      substitutionsVariables = {
        // Spread all config properties for easier access in templates.
        ...config.properties,
        // Also pass the properties grouped.
        properties: config.properties,
        // An array with the property names, for iteration in templates.
        propertiesNames: Object.keys(config.properties),
        // The project name, for convenience.
        projectName: config.projectName,
        // Current year, for copyright statements.
        year: currentTime.getFullYear().toString(),
      }
    } else {
      substitutionsVariables = {
        ...liquidSubstitutionsVariablesBase,
        // Pass the configuration properties grouped.
        matrix: {
          ...config.properties,
        },
        // An array with the property names, for iteration in templates.
        propertiesNames: Object.keys(config.properties),
        // The project name, for convenience.
        projectName: config.projectName,
        // Current year, for copyright statements.
        year: currentTime.getFullYear().toString(),
      }
    }

    this.substitutionsVariables = substitutionsVariables
    await this.generate()

    return 0 // success
  }

  /**
   * Generates the project files from the template.
   *
   * @remarks
   * This abstract method must be implemented by derived classes to define
   * the specific files and folder structure to create for the project.
   * Implementations should use {@link InitTemplateBase.copyFile},
   * {@link InitTemplateBase.copyFolder}, and
   * {@link InitTemplateBase.render} to create the project structure.
   * The substitution variables are available via the
   * {@link InitTemplateBase.substitutionsVariables} property.
   *
   * The implementation must be <b>asynchronous</b> to allow for file system
   * operations.
   *
   * @returns A promise that resolves when generation is complete.
   */
  abstract /* async */ generate(): Promise<void>

  /**
   * Determines whether the current platform is supported.
   *
   * @remarks
   * This method checks platform compatibility using a two-tier matching
   * strategy. First, it looks for an exact match with the current
   * platform-architecture combination (e.g., `darwin-arm64`). If not
   * found, it checks for a platform-only match (e.g., `darwin`). Returns
   * `false` if the platforms array is undefined, empty, or contains no
   * matches for the current execution environment.
   *
   * @param platforms - The array of supported platform identifiers, or
   * undefined if no platforms are specified.
   * @returns `true` if the current platform is supported, `false`
   * otherwise.
   */
  isPlatformSupported(platforms: string[] | undefined): boolean {
    assert(platforms && platforms.length !== 0, 'platforms array is required')

    if (platforms.includes(`${this.process.platform}-${this.process.arch}`)) {
      return true
    }

    if (platforms.includes(this.process.platform)) {
      return true
    }

    return false
  }

  /**
   * Copies a single file from the templates folder to the destination.
   *
   * @remarks
   * This method resolves the source file path relative to the templates
   * folder and copies it to the destination, creating any necessary
   * parent directories. The file is copied without modifications,
   * preserving its content and structure. Use
   * {@link InitTemplateBase.render} instead if variable substitution
   * is needed.
   *
   * @param sourceFileRelativePath - The relative path to the source file
   * within the templates folder.
   * @param destinationFilePath - The destination file path (defaults to
   * the same relative path as the source).
   * @returns A promise that resolves when the file has been copied.
   */
  async copyFile({
    sourceFileRelativePath,
    destinationFilePath = sourceFileRelativePath,
  }: {
    sourceFileRelativePath: string
    destinationFilePath?: string
  }): Promise<void> {
    assert(sourceFileRelativePath, 'sourceFileRelativePath is required')
    assert(destinationFilePath, 'destinationFilePath is required')

    const log = this.log

    const destinationFileRelativePath = path.relative(
      this.context.config.cwd,
      destinationFilePath
    )

    log.info(`Copying file '${destinationFileRelativePath}'...`)

    await fs.mkdir(path.dirname(destinationFilePath), { recursive: true })

    const sourceFileAbsolutePath = path.resolve(
      this.templatesFolderPath,
      sourceFileRelativePath
    )
    await fs.copyFile(sourceFileAbsolutePath, destinationFilePath)
  }

  /**
   * Copies an entire folder from the templates folder to the destination.
   *
   * @remarks
   * This method recursively copies the complete folder structure,
   * including all files and subfolders, from the source to the
   * destination. The entire folder tree is replicated, preserving the
   * relative paths and structure. Files are copied without
   * modifications; use {@link InitTemplateBase.render} for
   * individual files that require variable substitution.
   *
   * @param sourceFolderRelativePath - The relative path to the source folder
   * within the templates folder.
   * @param destinationFolderPath - The destination folder path (defaults to the
   * same relative path as the source).
   * @returns A promise that resolves when the folder has been copied.
   */
  async copyFolder({
    sourceFolderRelativePath,
    destinationFolderPath = sourceFolderRelativePath,
  }: {
    sourceFolderRelativePath: string
    destinationFolderPath?: string
  }): Promise<void> {
    assert(sourceFolderRelativePath, 'sourceFolderRelativePath is required')
    assert(destinationFolderPath, 'destinationFolderPath is required')

    const log = this.log

    log.info(`Copying folder '${destinationFolderPath}'...`)

    const sourceFolderAbsolutePath = path.resolve(
      this.templatesFolderPath,
      sourceFolderRelativePath
    )
    await this._copyFolderRecursively({
      sourceFolderPath: sourceFolderAbsolutePath,
      destinationFolderPath: path.resolve(destinationFolderPath),
    })
  }

  /**
   * Renders a template file using Liquid and writes the output.
   *
   * @remarks
   * This method processes a template file through the Liquid templating
   * engine with the provided substitution variables, generating the final
   * output file. Parent directories are created automatically if they do
   * not exist. The template file should be located in the templates
   * folder and use Liquid syntax for variable references (e.g.,
   * `{{ variableName }}`).
   *
   * The substitution variables include all project properties plus
   * additional context like the current year. If substitutionsVariables
   * is not provided, the instance's substitutionsVariables property is
   * used.
   *
   * @param sourceFilePath - The absolute path to the template
   * file within the templates folder.
   * @param destinationFilePath - The destination path for the rendered
   * file.
   * @param substitutionsVariables - The variables to use for template
   * substitutions (defaults to the instance's substitutionsVariables).
   * @returns A promise that resolves when the file has been rendered and
   * written.
   *
   * @throws {@link OutputError}
   * If template rendering fails.
   */
  async render({
    sourceFilePath,
    destinationFilePath,
    substitutionsVariables = this.substitutionsVariables,
  }: {
    sourceFilePath: string
    destinationFilePath: string
    substitutionsVariables?: InitTemplateSubstitutionsVariables
  }): Promise<void> {
    assert(sourceFilePath, 'sourceFilePath is required')
    assert(destinationFilePath, 'destinationFilePath is required')
    assert(
      substitutionsVariables !== undefined,
      'substitutionsVariables is required for rendering templates. ' +
        'Ensure that run() has been called to prepare the variables.'
    )

    const log = this.log
    const context = this.context
    const config = context.config
    const cwd = config.cwd

    const sourceFileRelativePath = path.relative(cwd, sourceFilePath)
    const destinationFileRelativePath = path.relative(cwd, destinationFilePath)

    log.info(
      `Rendering template '${sourceFileRelativePath}' as ` +
        `'${destinationFileRelativePath}'...`
    )

    log.trace(`render(${sourceFilePath}, ${destinationFilePath})`)

    // const headerPath = path.resolve(codePath, `${pnam}.h`)
    try {
      const fileContent = (await this.engine.renderFile(
        sourceFilePath,
        substitutionsVariables
      )) as string

      await fs.mkdir(path.dirname(destinationFilePath), { recursive: true })
      await fs.writeFile(destinationFilePath, fileContent, 'utf8')
    } catch (error) {
      if (error instanceof Error) {
        throw new OutputError(error.message)
      }
    }
  }

  /**
   * Validates a property value against its definition.
   *
   * @remarks
   * This method checks whether the provided value is valid for the
   * specified property according to its type definition. It performs
   * type-specific validation and conversion:
   *
   * <ul>
   * <li><b>For <code>select</code> properties:</b> validates against
   *    allowed items andchecks platform compatibility if specified</li>
   * <li><b>For <code>boolean</code> properties:</b> converts
   *    <code>'true'</code>/<code>'false'</code>
   *    strings to booleans</li>
   * <li><b>For <code>number</code> properties:</b> converts strings
   *    to numbers</li>
   * </ul>
   *
   * If the value is empty and a default is defined, the default value is
   * returned. For select properties with platform restrictions, only
   * platform-compatible items are considered valid.
   *
   * @param name - The property name to validate.
   * @param value - The property value to validate.
   * @returns The validated and potentially converted value (string,
   * boolean, or number).
   *
   * @throws {@link ConfigurationError}
   * If the property is unsupported or the value is invalid.
   */
  validatePropertyValue(
    name: string,
    value: string
  ): string | boolean | number {
    const propDef = this.propertiesDefinitions[name]

    if (propDef === undefined) {
      throw new ConfigurationError(`Unsupported property '${name}'`)
    }
    const trimmedValue = value.trim()

    if (trimmedValue === '') {
      if (propDef.default !== undefined) {
        return propDef.default
      }
    } else {
      switch (propDef.type) {
        case 'select':
          assert(
            propDef.items,
            `Property '${name}' of type 'select' has no items.`
          )
          if (propDef.items[value]) {
            if (typeof propDef.items[value] === 'string') {
              return value
            } else if (
              typeof propDef.items[value] === 'object' &&
              this.isPlatformSupported(propDef.items[value].platforms)
            ) {
              return value
            }
          }
          break

        case 'boolean':
          if (trimmedValue === 'true') {
            return true
          } else if (trimmedValue === 'false') {
            return false
          }
          break

        case 'number': {
          const num = Number(trimmedValue)
          if (isFinite(num)) {
            return num
          }
          break
        }

        case 'string':
          return value

        // No default, the definition was already validated.
      }
    }

    throw new ConfigurationError(
      `Unsupported value '${value}' for property '${name}'`
    )
  }

  // --------------------------------------------------------------------------
  // Protected Methods.

  /**
   * Prompts the user interactively for missing property values.
   *
   * @remarks
   * This method creates a readline interface and iteratively prompts the
   * user to provide values for properties without explicit values. For
   * each property, the prompt displays:
   *
   * <ul>
   * <li>The property label</li>
   * <li>Valid options (for select and boolean types)</li>
   * <li>The default value in brackets, if available</li>
   * </ul>
   *
   * If the user enters '?', help text is displayed showing the property
   * description and all valid options with their descriptions. Invalid
   * responses are rejected and the prompt is repeated until a valid value
   * is provided. Platform-incompatible options are excluded from select
   * properties.
   *
   * @returns A promise that resolves when all missing values have been
   * collected.
   */
  protected async _askForMoreValues() {
    const context = this.context
    const config = context.config

    assert(config.properties, 'config.properties is required')

    const rl = readline.createInterface({
      input: this.process.stdin,
      output: this.process.stdout,
    })

    for (const [name, definition] of Object.entries(
      this.propertiesDefinitions
    )) {
      if (config.properties[name]) {
        continue
      }
      let prompt = `${definition.label}?`
      switch (definition.type) {
        case 'select': {
          prompt += ' ('
          const validItems = []
          assert(definition.items, 'definition.items is required')
          for (const [ikey, ival] of Object.entries(definition.items)) {
            if (isString(ival)) {
              validItems.push(ikey)
            } else if (
              isObject(ival) &&
              this.isPlatformSupported(
                (ival as InitTemplateItemValue).platforms
              )
            ) {
              validItems.push(ikey)
            }
          }
          prompt += validItems.join(', ')
          prompt += ', ?)'
          break
        }
        case 'string':
          prompt += ' (string, ?)'
          break
        case 'number':
          prompt += ' (number, ?)'
          break
        case 'boolean':
          prompt += ' (true, false, ?)'
          break
        // No default, the definition was already validated.
      }

      if (definition.default !== undefined) {
        prompt += ` [${String(definition.default)}]`
      }
      prompt += ': '

      const MAX_RETRIES = 42
      let retryCount = 0

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      while (true) {
        /* c8 ignore start - Defensive check. */
        if (++retryCount > MAX_RETRIES) {
          throw new InputError(
            `Too many invalid attempts for property '${name}' ` +
              `(limit: ${String(MAX_RETRIES)})`
          )
        }
        /* c8 ignore stop */

        const answer = (await rl.question(prompt)).trim()
        // console.log('{' + answer + '}')
        try {
          const value = this.validatePropertyValue(name, answer)
          // console.log('[' + value + ']')
          config.properties[name] = value
          break
        } catch (error) {
          if (error instanceof Error) {
            this.log.trace(error.message)
          }
          this.process.stdout.write(`${definition.description}\n`)
          if (definition.type === 'select') {
            assert(definition.items, 'definition.items is required')
            for (const [ikey, ival] of Object.entries(definition.items)) {
              if (isString(ival)) {
                this.process.stdout.write(`- ${ikey}: ${ival as string}\n`)
              } else if (
                isObject(ival) &&
                this.isPlatformSupported(
                  (ival as InitTemplateItemValue).platforms
                )
              ) {
                this.process.stdout.write(
                  `- ${ikey}: ${(ival as InitTemplateItemValue).message}\n`
                )
              }
            }
          }
        }
      }
    }
  }

  /**
   * Recursively copies all contents of a source folder to a destination folder.
   *
   * @remarks
   * This internal method traverses the source folder structure and replicates
   * it at the destination, copying all files and recursively processing
   * subfolders.
   *
   * @param sourceFolderPath - The absolute path to the source folder.
   * @param destinationFolderPath - The absolute path to the destination folder.
   * @returns A promise that resolves when all contents have been copied.
   */
  protected async _copyFolderRecursively({
    sourceFolderPath,
    destinationFolderPath,
  }: {
    sourceFolderPath: string
    destinationFolderPath: string
  }): Promise<void> {
    // const log = this.log

    await fs.mkdir(destinationFolderPath, { recursive: true })

    const dirents = await fs.readdir(sourceFolderPath, {
      withFileTypes: true,
    })

    for (const dirent of dirents) {
      // log.trace(dirent.name)

      if (dirent.isDirectory()) {
        await this._copyFolderRecursively({
          sourceFolderPath: path.join(sourceFolderPath, dirent.name),
          destinationFolderPath: path.join(destinationFolderPath, dirent.name),
        })
      } else {
        await fs.copyFile(
          path.join(sourceFolderPath, dirent.name),
          path.join(destinationFolderPath, dirent.name)
        )
      }
    }
  }

  /**
   * Validates the structure and content of property definitions.
   *
   * @remarks
   * This internal method performs comprehensive validation of the property
   * definitions object during template construction, ensuring all definitions
   * are well-formed and internally consistent before the template is used.
   *
   * Validation steps:
   *
   * <ol>
   * <li><b>Overall structure:</b>
   *   <ul>
   *   <li>Verifies that <code>propertiesDefinitions</code> is an object.</li>
   *   <li>Ensures at least one property is defined (not empty).</li>
   *   </ul>
   * </li>
   * <li><b>Common property fields:</b>
   *   <ul>
   *   <li><code>label</code>: Must be a non-empty string.</li>
   *   <li><code>description</code>: Must be a non-empty string.</li>
   *   <li><code>isMandatory</code>: Must be a boolean if present.</li>
   *   <li><code>type</code>: Must be defined and one of: <code>select</code>,
   *      <code>string</code>, <code>number</code>, <code>boolean</code>.</li>
   *   </ul>
   * </li>
   * <li><b>Type-specific validation:</b>
   *   <ul>
   *   <li><b>Select properties:</b>
   *     <ul>
   *     <li>Must have an <code>items</code> object with at least one
   *        entry.</li>
   *     <li>Each item must be either a string (description) or an object with
   *        <code>platforms</code> array and <code>message</code> string.</li>
   *     <li>Non-mandatory properties must have a default value.</li>
   *     <li>Default values must be non-empty strings present in the items
   *        list.</li>
   *     </ul>
   *   </li>
   *   <li><b>String properties:</b> Default value must be a non-empty string
   *      if present.</li>
   *   <li><b>Number properties:</b> Default value must be a number if
   *      present.</li>
   *   <li><b>Boolean properties:</b> Default value must be a boolean if
   *      present.</li>
   *   </ul>
   * </li>
   * </ol>
   *
   * This validation ensures that templates are correctly configured before
   * use, preventing runtime errors during property processing and interactive
   * prompting. Any validation failure triggers an assertion error with a
   * descriptive message indicating the specific problem.
   */
  protected _validatePropertiesDefinitions(): void {
    assert(
      isObject(this.propertiesDefinitions),
      'propertiesDefinitions is not an object.'
    )

    assert(
      Object.keys(this.propertiesDefinitions).length > 0,
      'propertiesDefinitions is an empty object.'
    )

    for (const [key, val] of Object.entries(this.propertiesDefinitions)) {
      assert(isString(val.label), `Property '${key}' must have a string label`)
      assert(val.label.trim() !== '', `Property '${key}' has an empty label`)

      assert(
        isString(val.description),
        `Property '${key}' must have a string description`
      )
      assert(
        val.description.trim() !== '',
        `Property '${key}' has an empty description`
      )

      if (val.isMandatory !== undefined) {
        assert(
          isBoolean(val.isMandatory),
          `Property '${key}' has a non boolean isMandatory value.`
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      assert(val.type !== undefined, `Property '${key}' has no type defined.`)

      switch (val.type) {
        case 'select':
          assert(
            val.items !== undefined,
            `Property '${key}' of type 'select' has no items.`
          )

          assert(
            isObject(val.items),
            `Property '${key}' of type 'select' has invalid items.`
          )

          assert(
            Object.keys(val.items).length !== 0,
            `Property '${key}' of type 'select' has no items.`
          )

          for (const [ikey, ival] of Object.entries(val.items)) {
            assert(
              isString(ival) ||
                (isObject(ival) &&
                  Array.isArray((ival as InitTemplateItemValue).platforms) &&
                  isString((ival as InitTemplateItemValue).message)),
              `Property '${key}' has invalid item '${ikey}'.`
            )
          }

          if (!val.isMandatory) {
            assert(
              val.default !== undefined,
              `Property '${key}' of type 'select' ` +
                `must have a default value if not mandatory.`
            )
          }

          if (val.default !== undefined) {
            assert(
              isString(val.default),
              `Property '${key}' has a non string default value.`
            )

            assert(
              (val.default as string).trim() !== '',
              `Property '${key}' has an empty default value.`
            )
          }

          if (val.default !== undefined) {
            assert(
              Object.keys(val.items).includes(String(val.default)),
              `Property '${key}' has a default value not in items list.`
            )
          }
          break

        case 'string':
          if (val.default !== undefined) {
            assert(
              isString(val.default),
              `Property '${key}' has a non string default value.`
            )

            assert(
              (val.default as string).trim() !== '',
              `Property '${key}' has an empty default value.`
            )
          }
          break

        case 'number':
          if (val.default !== undefined) {
            assert(
              isNumber(val.default),
              `Property '${key}' has a non number default value.`
            )
          }
          break

        case 'boolean':
          if (val.default !== undefined) {
            assert(
              isBoolean(val.default),
              `Property '${key}' has a non boolean default value.`
            )
          }
          break

        default:
          assert(
            false,
            `Property '${key}' has unsupported type '${String(val.type)}'.`
          )

          break
      }
    }
  }
}

// ----------------------------------------------------------------------------
