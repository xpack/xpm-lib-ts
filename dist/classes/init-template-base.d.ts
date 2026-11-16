import { Liquid, LiquidOptions } from 'liquidjs';
import { Logger } from '@xpack/logger';
import { InitTemplatePropertiesDefinitions, InitTemplateSubstitutionsVariables } from '../types/xpm-init-template.js';
import { Context } from '../types/xpm.js';
import type { Policies } from './policies.js';
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
    context: Context;
    /**
     * The absolute path to the templates folder.
     */
    templatesFolderPath: string;
    /**
     * Definitions of all properties supported by this template.
     */
    propertiesDefinitions: InitTemplatePropertiesDefinitions;
    /**
     * The Node.js process object (defaults to the global `process`).
     * Intended for testing purposes to allow mocking of process properties
     * and methods.
     */
    process?: NodeJS.Process;
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
    options?: LiquidOptions;
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
    policies: Policies;
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
export declare abstract class InitTemplateBase {
    /**
     * The <b>xpm</b> context containing configuration and logging utilities.
     */
    readonly context: Context;
    /**
     * The logger instance for output and diagnostics.
     */
    readonly log: Logger;
    /**
     * Definitions of all properties supported by this template.
     */
    readonly propertiesDefinitions: InitTemplatePropertiesDefinitions;
    /**
     * The absolute path to the templates folder.
     */
    readonly templatesFolderPath: string;
    /**
     * The Liquid templating engine instance.
     */
    readonly engine: Liquid;
    /**
     * The variables to be used for template substitutions.
     */
    substitutionsVariables?: InitTemplateSubstitutionsVariables;
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
    isInteractive: boolean;
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
    readonly process: NodeJS.Process;
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
    policies: Policies;
    /**
     * Constructs an `xpm init` template instance.
     *
     * @param context - The <b>xpm</b> context containing configuration and
     *    logging.
     * @param __dirname - The absolute path to the module folder.
     * @param templatesFolderPath - The absolute path to the templates folder.
     * @param propertiesDefinitions - The definitions of all supported properties.
     */
    constructor({ context, templatesFolderPath, propertiesDefinitions, process: _process, options, policies, }: InitTemplateConstructorParameters);
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
    run(): Promise<number>;
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
    abstract generate(): Promise<void>;
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
    isPlatformSupported(platforms: string[] | undefined): boolean;
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
    copyFile({ sourceFileRelativePath, destinationFilePath, }: {
        sourceFileRelativePath: string;
        destinationFilePath?: string;
    }): Promise<void>;
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
    copyFolder({ sourceFolderRelativePath, destinationFolderPath, }: {
        sourceFolderRelativePath: string;
        destinationFolderPath?: string;
    }): Promise<void>;
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
    render({ sourceFilePath, destinationFilePath, substitutionsVariables, }: {
        sourceFilePath: string;
        destinationFilePath: string;
        substitutionsVariables?: InitTemplateSubstitutionsVariables;
    }): Promise<void>;
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
    validatePropertyValue(name: string, value: string): string | boolean | number;
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
    protected _askForMoreValues(): Promise<void>;
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
    protected _copyFolderRecursively({ sourceFolderPath, destinationFolderPath, }: {
        sourceFolderPath: string;
        destinationFolderPath: string;
    }): Promise<void>;
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
    protected _validatePropertiesDefinitions(): void;
}
//# sourceMappingURL=init-template-base.d.ts.map