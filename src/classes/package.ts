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
import * as fs from 'node:fs/promises'
import * as path from 'node:path'

// https://www.npmjs.com/package/semver
import semver from 'semver'

// https://www.npmjs.com/package/@xpack/logger
import { Logger } from '@xpack/logger'

// ----------------------------------------------------------------------------

import { ConfigurationError, InputError, PrerequisitesError } from './errors.js'
import { isString } from '../functions/is-something.js'
import { hasLiquidSyntax } from '../functions/utils.js'
import {
  JsonBuildConfigurationContent,
  JsonBuildConfigurationTemplate,
  JsonPackageSpecifier,
  JsonXpmPackage,
} from '../types/json.js'

// ============================================================================

/**
 * Configuration parameters for constructing a package instance.
 *
 * @remarks
 * This interface defines the required configuration for creating an
 * instance of {@link Package}. Both properties are mandatory.
 *
 * The parameters provide the absolute path to the package folder containing
 * (or that will contain) the <code>package.json</code> file, and the logger
 * for diagnostic output during package operations.
 */
export interface PackageConstructorParameters {
  /**
   * The absolute path to the package folder.
   */
  packageFolderPath: string

  /**
   * The logger instance for output and diagnostics.
   */
  log: Logger
}

/**
 * Provides access to package metadata and xpm-specific validation.
 *
 * @remarks
 * This class loads and validates `package.json` content, determines
 * package capabilities, and provides helper methods used across <b>xpm</b>
 * workflows.
 *
 * The package abstraction provides a layer over `package.json` processing
 * with progressive validation:
 *
 * <ol>
 * <li><b>Basic file I/O:</b> Read and write <code>package.json</code> with
 *    error handling.</li>
 * <li><b>npm validation:</b> Check for valid npm package structure (name,
 * version).</li>
 * <li><b>xpm validation:</b> Verify <code>xpack</code> section presence
 *    and structure.</li>
 * <li><b>Binary package validation:</b> Validate binary-specific metadata
 *    (executables, binaries, platforms).</li>
 * <li><b>Capability detection:</b> Determine package features (scripts,
 *    actions, build configurations).</li>
 * <li><b>Version checking:</b> Validate minimum <b>xpm</b> version
 *    requirements.</li>
 * <li><b>Specifier parsing:</b> Extract scope, name, and version from package
 *    identifiers.</li>
 * </ol>
 *
 * This hierarchy allows validation to be performed incrementally as needed,
 * avoiding unnecessary checks for packages that don't meet earlier criteria.
 */
export class Package {
  // --------------------------------------------------------------------------
  // Public Members.

  /**
   * The absolute path to the package folder.
   *
   * @remarks
   * This path serves as the base folder for all package operations,
   * including reading/writing `package.json` and resolving relative paths.
   *
   * Path requirements:
   *
   * <ol>
   * <li>Must be an absolute path to a folder.</li>
   * <li>Folder should contain (or will contain) a <code>package.json</code>
   *    file.</li>
   * <li>Used to construct the path to <code>package.json</code> as
   *    <code>\{packageFolderPath\}/package.json</code>.</li>
   * <li>Remains constant throughout the lifecycle of the
   *    <code>Package</code> instance.</li>
   * </ol>
   *
   * The path is set during construction and used by all methods that access
   * or modify `package.json`.
   */
  packageFolderPath: string

  /**
   * The parsed `package.json` content, when available.
   *
   * @remarks
   * This property caches the parsed `package.json` content after successful
   * reading, avoiding repeated file I/O and parsing operations.
   *
   * Lifecycle states:
   *
   * <ol>
   * <li>Initially undefined when the <code>Package</code> instance
   *    is created.</li>
   * <li>Populated by <code>Package.readPackageDotJson()</code> upon
   *    successful read and parse.</li>
   * <li>Cleared to undefined if parsing fails with
   *    <code>withThrow</code> enabled.</li>
   * <li>Used by validation methods (<code>isNpmPackage</code>,
   *    <code>isxpm.Package</code>,
   *    <code>isBinaryXpmPackage</code>) to check package capabilities.</li>
   * <li>Not automatically updated when <code>package.json</code> is
   *    modified externally;
   *    call <code>Package.readPackageDotJson()</code> again to refresh.</li>
   * </ol>
   *
   * The cached content improves performance for packages that perform
   * multiple validation checks without file system access overhead.
   */
  jsonPackage?: JsonXpmPackage | undefined

  // --------------------------------------------------------------------------
  // Protected Members.

  /**
   * The logger instance for output and diagnostics.
   *
   * @remarks
   * This logger provides trace-level diagnostics for package operations,
   * including file I/O, parsing, validation, and version checking.
   *
   * Logging use cases:
   *
   * <ol>
   * <li>Trace package folder path during construction.</li>
   * <li>Log file read errors when investigating missing
   *    <code>package.json</code>.</li>
   * <li>Trace JSON parsing errors for debugging invalid
   *    <code>package.json</code>.</li>
   * <li>Log version validation details during <code>minimumXpmRequired</code>
   *    checks.</li>
   * <li>Trace package specifier parsing for debugging dependency
   *    resolution.</li>
   * </ol>
   *
   * The logger enables detailed diagnostics without affecting normal
   * operation, as trace-level output is typically disabled in production.
   */
  protected readonly _log: Logger

  // --------------------------------------------------------------------------
  // Constructor.

  /**
   * Constructs a package helper bound to a specific folder.
   *
   * @param packageFolderPath - The absolute path to the package folder.
   * @param log - The logger instance for output and diagnostics.
   *
   * @throws {@link InputError}
   * If packageFolderPath is not provided or is not an absolute path.
   */
  constructor({ packageFolderPath, log }: PackageConstructorParameters) {
    assert(
      packageFolderPath && path.isAbsolute(packageFolderPath),
      `packageFolderPath must be an absolute path, got: ${packageFolderPath}`
    )

    this._log = log
    this.packageFolderPath = packageFolderPath

    log.trace(`${Package.name}(${packageFolderPath})`)
  }

  // --------------------------------------------------------------------------
  // Public Methods.

  /**
   * Reads and parses `package.json` from the package folder.
   *
   * @remarks
   * This method provides flexible error handling for scenarios where a
   * missing or invalid `package.json` may be expected (e.g., checking whether
   * a folder is a package) versus scenarios where it indicates a critical
   * error (e.g., operating on a known package).
   *
   * When `withThrow` is false, the method returns undefined for missing or
   * invalid files, allowing callers to handle the absence gracefully. When
   * `withThrow` is true, errors are thrown as {@link InputError} for
   * consistent error handling across the application.
   *
   * @param withThrow - Whether to throw on missing or invalid `package.json`.
   * @returns The parsed `package.json` content, or undefined when missing or
   * invalid and `withThrow` is false.
   *
   * @throws {@link InputError}
   * If `package.json` is missing or invalid and `withThrow` is true.
   */
  async readPackageDotJson({
    withThrow = false,
  }: {
    withThrow?: boolean
  } = {}): Promise<JsonXpmPackage | undefined> {
    const jsonFilePath = path.join(this.packageFolderPath, 'package.json')

    let fileContent: string | Buffer
    try {
      fileContent = await fs.readFile(jsonFilePath)
    } catch (error) {
      if (withThrow) {
        if (error instanceof Error) {
          this._log.trace(error.message)
        }
        throw new InputError(
          `no package.json in folder ‘${this.packageFolderPath}’`
        )
      } else {
        return undefined
      }
    }

    try {
      this.jsonPackage = JSON.parse(fileContent.toString()) as JsonXpmPackage
    } catch (error) {
      if (withThrow) {
        this.jsonPackage = undefined
        if (error instanceof Error) {
          this._log.trace(error.message)
        }
        throw new InputError(
          `invalid package.json in folder ‘${this.packageFolderPath}’`
        )
      } else {
        return undefined
      }
    }
    return this.jsonPackage
  }

  /**
   * Writes the provided `package.json` content to disk.
   *
   * @remarks
   * The JSON content is passed explicitly rather than using the cached
   * value.
   *
   * @param jsonPackage - The `package.json` content to write.
   * @returns A promise that resolves when the file has been written.
   */
  async rewritePackageDotJson(jsonPackage: JsonXpmPackage): Promise<void> {
    const log = this._log

    assert(jsonPackage, 'jsonPackage is required')
    const jsonString = JSON.stringify(jsonPackage, null, 2) + '\n'

    const jsonFilePath = path.join(this.packageFolderPath, 'package.json')
    log.trace(`write filePath: '${jsonFilePath}'`)
    await fs.writeFile(jsonFilePath, jsonString)
  }

  /**
   * Determines whether the `package.json` content represents a valid
   * npm package.
   *
   * @returns `true` if the package has a valid name and version, `false`
   * otherwise.
   */
  isNpmPackage(): boolean {
    const jsonPackage = this.jsonPackage
    if (!jsonPackage) {
      return false
    }

    if (jsonPackage.name === undefined || jsonPackage.version === undefined) {
      return false
    }
    const name = jsonPackage.name.trim()
    if (name.length === 0) {
      return false
    }
    const version = jsonPackage.version.trim()
    if (version.length === 0) {
      return false
    }

    return true
  }

  /**
   * Determines whether the package is an <b>xpm</b> package.
   *
   * @returns `true` if the package is a valid npm package with an xpack
   * section, `false` otherwise.
   */
  isXpmPackage(): boolean {
    const jsonPackage = this.jsonPackage

    if (!this.isNpmPackage()) {
      return false
    }

    if (jsonPackage?.xpack === undefined) {
      return false
    }
    return true
  }

  /**
   * Determines whether the package is a binary <b>xpm</b> package.
   *
   * @remarks
   * Binary packages must have both executables and binaries. The
   * presence of one implies the other, so this method validates consistency.
   *
   * Validation rules:
   *
   * <ol>
   * <li>If <code>xpack.executables</code> (or deprecated
   *    <code>xpack.bin</code>) exists, then
   *    <code>xpack.binaries</code> and <code>xpack.binaries.platforms</code>
   *    must also exist.</li>
   * <li>If <code>xpack.binaries</code> exists, then
   *    <code>xpack.binaries.platforms</code> and
   *    <code>xpack.executables</code> (or deprecated
   *    <code>xpack.bin</code>) must also exist.</li>
   * </ol>
   *
   * This bidirectional validation ensures package metadata consistency and
   * catches incomplete binary package configurations early. The check helps
   * prevent runtime errors when attempting to install or use binary packages
   * with missing metadata.
   *
   * @returns `true` if the package defines binaries and executables, `false`
   * otherwise.
   *
   * @throws {@link InputError}
   * If required binary package fields are missing.
   */
  isBinaryXpmPackage() {
    const jsonPackage = this.jsonPackage

    if (!this.isXpmPackage()) {
      return false
    }

    // Since Nov. 2024, `executables` is preferred to `bin`.
    if (jsonPackage?.xpack.executables ?? jsonPackage?.xpack.bin) {
      // If it has `executables` or `bin`, it must have `binaries` and
      // `binaries.platforms` too.
      if (!jsonPackage.xpack.binaries) {
        throw new ConfigurationError(
          "doesn't look like a proper binary xpm package, " +
            'package.json has no "xpack.binaries"'
        )
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!jsonPackage.xpack.binaries.platforms) {
        throw new ConfigurationError(
          "doesn't look like a proper binary xpm package, " +
            'package.json has no "xpack.binaries.platforms"'
        )
      }
      return true
    }
    if (jsonPackage?.xpack.binaries) {
      // If it has `binaries`, it must have `binaries.platforms` and
      // `executables` too.

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!jsonPackage.xpack.binaries.platforms) {
        throw new ConfigurationError(
          "doesn't look like a proper binary xpm package, " +
            'package.json has no "xpack.binaries.platforms"'
        )
      }
      // if (!(jsonPackage.xpack.executables ?? jsonPackage.xpack.bin)) {
      throw new ConfigurationError(
        "doesn't look like a proper binary xpm package, " +
          'package.json has no "xpack.executables"'
      )
      //}
      //return true
    }
    return false
  }

  /**
   * Determines whether the package is a Node module without <b>xpm</b>
   * metadata.
   *
   * @returns `true` if the package is a Node module without <b>xpm</b>
   * metadata, `false` otherwise.
   */
  isNodeModule() {
    const jsonPackage = this.jsonPackage

    if (!this.isNpmPackage()) {
      return false
    }

    if (jsonPackage?.xpack) {
      return false
    }

    return true
  }

  /**
   * Determines whether the package is a Node module with a binary entry.
   *
   * @returns `true` if the package is a Node module with a bin entry,
   * `false` otherwise.
   */
  isBinaryNodeModule() {
    const jsonPackage = this.jsonPackage

    if (!this.isNodeModule()) {
      return false
    }

    if (jsonPackage?.bin === undefined) {
      return false
    }

    return true
  }

  /**
   * Determines whether the package defines any npm scripts.
   *
   * @returns `true` if at least one script is defined, `false` otherwise.
   */
  hasNpmScripts(): boolean {
    const jsonPackage = this.jsonPackage

    if (
      jsonPackage?.scripts !== undefined &&
      Object.keys(jsonPackage.scripts).length > 0
    ) {
      return true
    }

    return false
  }

  /**
   * Determines whether the package defines any <b>xpm</b> actions.
   *
   * @remarks
   * This method performs a comprehensive search for action definitions at
   * both the package level and within build configurations, including
   * template-based configurations.
   *
   * Action detection strategy:
   *
   * <ol>
   * <li>Check for package-level actions in <code>xpack.actions</code>.</li>
   * <li>If no package-level actions, iterate through all build
   *    configurations.</li>
   * <li>For each configuration, determine if it's a template (name contains
   *    Liquid syntax) or a regular configuration.</li>
   * <li>For templates: Check <code>template.actions</code> for action
   *    definitions.</li>
   * <li>For regular configurations: Check <code>actions</code> directly.</li>
   * <li>Return true if any actions are found at any level.</li>
   * </ol>
   *
   * This comprehensive check is useful for determining whether <b>xpm</b>
   * action
   * commands should be available or whether the package requires <b>xpm</b> for
   * build automation.
   *
   * @returns `true` if actions are defined directly or within build
   * configurations, `false` otherwise.
   */
  hasXpmActions(): boolean {
    const json = this.jsonPackage

    try {
      if (
        json?.xpack.actions !== undefined &&
        Object.keys(json.xpack.actions).length > 0
      ) {
        return true
      }

      if (
        json?.xpack.buildConfigurations !== undefined &&
        Object.keys(json.xpack.buildConfigurations).length > 0
      ) {
        for (const [
          buildConfigurationName,
          buildConfiguration,
        ] of Object.entries(json.xpack.buildConfigurations)) {
          if (hasLiquidSyntax(buildConfigurationName)) {
            const buildConfigurationTemplate =
              buildConfiguration as JsonBuildConfigurationTemplate
            if (
              buildConfigurationTemplate.template.actions !== undefined &&
              Object.keys(buildConfigurationTemplate.template.actions).length >
                0
            ) {
              return true
            }
          } else {
            const buildConfigurationContent =
              buildConfiguration as JsonBuildConfigurationContent
            if (
              buildConfigurationContent.actions !== undefined &&
              Object.keys(buildConfigurationContent.actions).length > 0
            ) {
              return true
            }
          }
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      // In case xpack is not an option to get its properties.
    }

    return false
  }

  /**
   * Retrieves the minimum required <b>xpm</b> version specified by the package.
   *
   * @returns The minimum required <b>xpm</b> version without pre-release
   * suffixes, or
   * undefined if not specified.
   */
  getMinimumXpmRequired(): string | undefined {
    const log = this._log
    const jsonPackage = this.jsonPackage

    log.trace(`${Package.name}.getMinimumXpmRequired()`)

    const version = jsonPackage?.xpack.minimumXpmRequired
    if (version === undefined) {
      return undefined
    }

    if (!isString(version)) {
      return undefined
    }

    // Remove the pre-release part.
    return version.replace(/-.*$/, '')
  }

  /**
   * Validates the minimum required <b>xpm</b> version against the
   * installed CLI.
   *
   * @remarks
   * This method ensures that packages requiring specific <b>xpm</b>
   * features or bug
   * fixes can enforce a minimum version requirement, preventing runtime
   * errors or unexpected behavior with older <b>xpm</b> versions.
   *
   * Validation workflow:
   *
   * <ol>
   * <li>Check if package is an <b>xpm</b> package with
   *    <code>minimumXpmRequired</code> set.</li>
   * <li>Clean the required version by removing pre-release suffixes.</li>
   * <li>Load the <b>xpm</b> CLI's <code>package.json</code> from the
   *     provided root folder.</li>
   * <li>Extract and clean the installed <b>xpm</b> version.</li>
   * <li>Compare versions using semver to determine if upgrade is needed.</li>
   * <li>Throw <code>PrerequisitesError</code> if installed version is
   * too old.</li>
   * </ol>
   *
   * Pre-release suffixes are stripped from both versions to ensure that
   * pre-release builds satisfy version requirements (e.g., 1.0.0-beta
   * satisfies minimumXpmRequired: 1.0.0).
   *
   * @param xpmRootFolderPath - The folder path to the <b>xpm</b> CLI package.
   * @returns The cleaned minimum required version, or undefined if no check is
   * required.
   *
   * @throws {@link PrerequisitesError}
   * If the installed <b>xpm</b> version is lower than the required minimum.
   */
  async checkMinimumXpmRequired({
    xpmRootFolderPath,
  }: {
    xpmRootFolderPath: string
  }): Promise<string | undefined> {
    const log = this._log
    const jsonPackage = this.jsonPackage

    log.trace(`${Package.name}.checkMinimumXpmRequired()`)

    if (!this.isXpmPackage()) {
      // Not in an xpm package.
      return undefined
    }

    const minimumXpmRequired = this.getMinimumXpmRequired()
    if (!minimumXpmRequired) {
      log.trace('minimumXpmRequired not used, no checks')
      return undefined
    }

    log.trace(`minimumXpmRequired: ${minimumXpmRequired}`)

    let jsonXpmCliPackage: JsonXpmPackage | undefined
    try {
      const cliXpmPackage = new Package({
        log,
        packageFolderPath: xpmRootFolderPath,
      })
      jsonXpmCliPackage = await cliXpmPackage.readPackageDotJson({
        withThrow: true,
      })
    } catch (error) {
      if (error instanceof Error) {
        log.trace(error.message)
        // Safety net: This handles non-Error exceptions. Node.js fs operations
        // and the Package class consistently throw Error instances, but this
        // provides defensive handling for unexpected error types that might
        // occur in edge cases or future code changes.
        /* c8 ignore start - safety net, currently all are Errors */
      } else {
        log.trace(error)
      }
      /* c8 ignore stop */
      return undefined
    }
    assert(jsonXpmCliPackage, 'jsonXpmCliPackage is required')
    log.trace(jsonXpmCliPackage.version)

    if (!jsonXpmCliPackage.version) {
      return undefined
    }

    // Remove the pre-release part.
    const xpmVersion = semver.clean(
      jsonXpmCliPackage.version.replace(/-.*$/, '')
    )
    if (!xpmVersion) {
      return undefined
    }
    if (semver.lt(xpmVersion, minimumXpmRequired)) {
      assert(jsonPackage?.name, 'jsonPackage.name is required')
      throw new PrerequisitesError(
        `package '${jsonPackage.name}' ` +
          `requires xpm v${minimumXpmRequired} or later, please upgrade`
      )
    }
    // Check passed.
    return minimumXpmRequired
  }

  /**
   * Parses an npm package specifier into its components.
   *
   * @remarks
   * npm package specifiers can take several forms:
   *
   * <ul>
   * <li><b>Unscoped without version:</b> <code>package-name</code></li>
   * <li><b>Unscoped with version:</b> <code>package-name\@1.2.3</code></li>
   * <li><b>Scoped without version:</b> <code>\@scope/package-name</code></li>
   * <li><b>Scoped with version:</b>
   *    <code>\@scope/package-name\@1.2.3</code></li>
   * </ul>
   *
   * Parsing strategy:
   *
   * <ol>
   * <li>If specifier starts with <code>\@</code>, extract scope and handle
   *   scoped format.</li>
   * <li>Split on <code>/</code> to separate scope from name\@version.</li>
   * <li>Split the second part on <code>\@</code> to separate name from
   *   version.</li>
   * <li>For unscoped packages, split directly on <code>\@</code> to separate
   *    name from version.</li>
   * </ol>
   *
   * The parser handles all valid npm package specifier formats and returns
   * structured components for downstream processing. Invalid formats with
   * multiple slashes are rejected.
   *
   * @param npmPackageSpecifier - The npm package specifier to parse.
   * @returns The parsed package specifier components.
   *
   * @throws {@link InputError}
   * If the specifier is not a valid package name format.
   */
  parsePackageSpecifier({
    npmPackageSpecifier,
  }: {
    npmPackageSpecifier: string
  }): JsonPackageSpecifier {
    assert(npmPackageSpecifier, 'npmPackageSpecifier is required')

    const log = this._log

    let scope: string | undefined
    let name: string | undefined
    let version: string | undefined

    if (npmPackageSpecifier.startsWith('@')) {
      const arr = npmPackageSpecifier.split('/')
      if (arr.length > 2) {
        throw new InputError(`'${npmPackageSpecifier}' not a package name`)
      }
      let nameAndVersion: string | undefined
      ;[scope, nameAndVersion] = arr
      if (nameAndVersion !== undefined) {
        ;[name, version] = nameAndVersion.split('@')
      }
    } else {
      ;[name, version] = npmPackageSpecifier.split('@')
    }
    log.trace(
      `${npmPackageSpecifier} => ` +
        `${scope ?? '?'} ${name ?? '?'} ${version ?? '?'}`
    )

    return { scope, name, version }
  }
}

// ----------------------------------------------------------------------------
