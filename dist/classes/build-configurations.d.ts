import { Logger } from '@xpack/logger';
import { LiquidEngine } from './liquid-engine.js';
import { LiquidSubstitutionsVariables, LiquidSubstitutionsStrings } from '../data/substitutions-variables.js';
import { JsonBuildConfigurations, JsonBuildConfigurationTemplate, JsonBuildConfiguration, JsonBuildConfigurationContent, JsonDependencies } from '../types/json.js';
import { Actions, Action } from './actions.js';
/**
 * Configuration parameters for constructing a build configurations collection.
 *
 * @remarks
 * This interface defines the required configuration for creating an
 * instance of {@link BuildConfigurations}. Most properties are mandatory
 * except for the optional <code>jsonBuildConfigurations</code>, which can
 * be undefined if there are no build configurations defined in the package.
 *
 * The parameters provide the collection with access to the Liquid templating
 * engine, substitution variables hierarchy, build configuration definitions
 * from the package manifest, and the logger for diagnostic output during
 * configuration processing.
 */
export interface BuildConfigurationsConstructorParameters {
    /**
     * The Liquid templating engine for variable substitution.
     */
    engine: LiquidEngine;
    /**
     * The variables available for substitution in configuration definitions.
     */
    substitutionsVariables: LiquidSubstitutionsVariables;
    /**
     * The JSON build configurations definitions, or undefined if no build
     * configurations are defined.
     */
    jsonBuildConfigurations: JsonBuildConfigurations | undefined;
    /**
     * The logger instance for output and diagnostics.
     */
    log: Logger;
}
/**
 * A collection of <b>xpm</b> build configurations.
 *
 * @remarks
 * This class manages build configurations defined in package metadata,
 * including template expansion with matrix parameters and initialisation of
 * derived configuration instances.
 *
 * Configuration lifecycle phases:
 *
 * <ol>
 * <li><b>Construction:</b> Basic setup without processing configurations.</li>
 * <li><b>Initialisation:</b> Template name expansion without content
 *    evaluation.</li>
 * <li><b>Retrieval:</b> On-demand instantiation when accessed via
 *    <code>get()</code>.</li>
 * <li><b>Configuration Initialisation:</b> Full processing including
 *    inheritance, property resolution, dependency substitution, and
 *    action preparation.</li>
 * </ol>
 *
 * This lazy evaluation strategy ensures that only configurations actually
 * used incur the cost of template evaluation, inheritance resolution, and
 * variable substitution.
 */
export declare class BuildConfigurations {
    /**
     * The logger instance for output and diagnostics.
     *
     * @remarks
     * This logger provides trace-level diagnostics throughout the build
     * configuration lifecycle, including template expansion, inheritance
     * resolution, property merging, and dependency substitution. It enables
     * detailed debugging of complex build configuration hierarchies without
     * impacting runtime performance when tracing is disabled.
     */
    readonly log: Logger;
    /**
     * The Liquid templating engine for variable substitution.
     *
     * @remarks
     * This engine instance is shared across all build configurations and
     * configured with custom filters for platform detection, path
     * manipulation, and xpm-specific operations. It processes templates in
     * configuration names, matrix parameters, properties, dependencies, and
     * actions, ensuring consistent template evaluation throughout the
     * configuration lifecycle.
     */
    readonly engine: LiquidEngine;
    /**
     * The variables available for substitution in configuration definitions.
     *
     * @remarks
     * This comprehensive variable hierarchy provides the base context for all
     * build configuration template evaluation, extended per-configuration with
     * specific properties, dependencies, and matrix parameters.
     *
     * Base hierarchy includes:
     *
     * <ol>
     * <li><b>Environment variables:</b> <code>env</code> namespace with system
     *    environment.</li>
     * <li><b>Platform detection:</b> <code>os</code> namespace with
     *    platform-specific values.</li>
     * <li><b>Path utilities:</b> <code>path</code> namespace with path
     *    manipulationfunctions.</li>
     * <li><b>Package metadata:</b> <code>package</code> namespace with
     *    name, version, dependencies.</li>
     * </ol>
     *
     * Individual configurations extend this with their own `properties`,
     * `configuration`, and `matrix` namespaces during initialisation.
     */
    readonly substitutionsVariables: LiquidSubstitutionsVariables;
    /**
     * The JSON object containing build configuration definitions.
     *
     * @remarks
     * This object holds raw build configuration definitions from the
     * `package.json` `xpack.buildConfigurations` section. Configurations can be:
     *
     * <ol>
     * <li><b>Regular configurations:</b> Direct objects with properties,
     *    dependencies, actions, and inheritance.</li>
     * <li><b>Template configurations:</b> Objects with <code>matrix</code>
     *    and <code>template</code>
     *    properties for generating multiple configurations from a single
     *    definition.</li>
     * </ol>
     *
     * Template configuration names (containing `{{` markers) trigger matrix
     * expansion during initialisation, creating concrete configurations from
     * the Cartesian product of matrix parameter values. Each configuration
     * can inherit from others, creating complex dependency hierarchies.
     */
    readonly jsonBuildConfigurations: JsonBuildConfigurations;
    /**
     * Map of build configuration names to their corresponding instances.
     *
     * @remarks
     * This map serves as the primary configuration registry, populated during
     * collection initialisation with entries for all discovered configurations.
     *
     * Key characteristics:
     *
     * <ol>
     * <li>Known only after <code>BuildConfigurations.initialise()</code>
     *    completes.</li>
     * <li>Possibly empty if there are no build configurations defined.</li>
     * <li>Values can be <code>undefined</code> to indicate a configuration
     *    exists but hasn't been instantiated yet (lazy loading).</li>
     * <li>For template configurations, contains one entry per expanded
     *    combination, not the original template definition.</li>
     * </ol>
     *
     * Configurations transition from `undefined` to instantiated when first
     * accessed via {@link BuildConfigurations.get}, implementing the
     * lazy evaluation pattern to avoid unnecessary processing.
     */
    protected readonly _buildConfigurationsMap: Map<string, BuildConfiguration | undefined>;
    /**
     * Map of expanded build configuration names to their JSON source names.
     *
     * @remarks
     * This reverse mapping enables retrieving the original configuration
     * definition from `jsonBuildConfigurations` when lazy-loading
     * configuration instances.
     *
     * Mapping behavior:
     *
     * <ol>
     * <li><b>For regular configurations:</b> Maps configuration name to itself
     *    (identity mapping).</li>
     * <li><b>For template configurations:</b> Maps each generated configuration
     *    name
     *    back to the original template name (e.g., <code>release-x64</code> →
     *    <code>release-\{\{ matrix.arch \}\}</code>).</li>
     * <li>Known only after <code>BuildConfigurations.initialise()</code>
     *    completes.</li>
     * <li>Enables <code>BuildConfigurations.get()</code> to locate the
     *    correct JSON definition when instantiating a configuration on
     *    demand.</li>
     * </ol>
     *
     * This indirection is essential for lazy evaluation, allowing deferred
     * instantiation while maintaining the connection to original definitions.
     */
    protected readonly _jsonBuildConfigurationsNamesMap: Map<string, string>;
    /**
     * Set of all build configuration names for duplicate detection.
     *
     * @remarks
     * This set provides O(1) existence checks for configuration names,
     * enabling efficient validation during template expansion to prevent
     * duplicate configurations.
     *
     * Duplicate scenarios detected:
     *
     * <ol>
     * <li>Explicit duplicates in <code>package.json</code> with identical
     *    names.</li>
     * <li>Template expansion conflicts where different templates generate the
     *    same concrete configuration name.</li>
     * <li>Conflicts between template-generated names and explicitly defined
     *    configuration names.</li>
     * </ol>
     *
     * Detection occurs during {@link BuildConfigurations.initialise},
     * throwing {@link ConfigurationError} when duplicates are found to ensure
     * configuration name uniqueness.
     */
    protected readonly _namesSet: Set<string>;
    /**
     * Flag indicating whether the collection has been initialised.
     *
     * @remarks
     * This flag prevents redundant initialisation and ensures idempotent
     * behavior when {@link BuildConfigurations.initialise} is called
     * multiple times.
     *
     * State transitions:
     *
     * <ol>
     * <li>Initially <code>false</code> after construction.</li>
     * <li>Set to <code>true</code> after successful template expansion
     *    and configuration
     *    name registration.</li>
     * <li>Checked at the beginning of
     *    <code>BuildConfigurations.initialise()</code> to return early if
     *    already initialised.</li>
     * </ol>
     *
     * This pattern supports safe repeated calls during complex initialisation
     * sequences without duplicating work or corrupting internal state.
     */
    protected _isInitialised: boolean;
    /**
     * Cached array of all build configuration names in the collection.
     *
     * @remarks
     * This array provides O(1) access to configuration names without
     * repeatedly creating new arrays from the map keys, improving performance
     * when the names are accessed multiple times.
     *
     * Key characteristics:
     *
     * <ol>
     * <li>Empty initially after construction.</li>
     * <li>Populated during
     *    <code>BuildConfigurations.initialise()</code> after all
     *    configuration names are determined.</li>
     * <li>Contains all configuration names including those generated from
     *    templates.</li>
     * <li>Returned by the <code>names</code> getter for efficient repeated
     *    access.</li>
     * </ol>
     *
     * This cached approach avoids the overhead of calling
     * `Array.from(map.keys())` on every access whilst still
     * providing a clean getter interface.
     */
    protected _names: string[];
    /**
     * Constructs a build configurations collection.
     *
     * @remarks
     * The constructor performs partial initialisation. Complete
     * initialisation requires calling
     * {@link BuildConfigurations.initialise}.
     *
     * @param engine - The Liquid templating engine for variable substitution.
     * @param substitutionsVariables - The variables available for substitution.
     * @param jsonBuildConfigurations - The JSON build configurations definitions,
     * or undefined if no build configurations are defined.
     * @param log - The logger instance for output and diagnostics.
     */
    constructor({ engine, substitutionsVariables, jsonBuildConfigurations, log, }: BuildConfigurationsConstructorParameters);
    /**
     * Completes the async initialisation of the build configurations collection.
     *
     * @remarks
     * This method implements the first step of lazy evaluation. It processes
     * all build configuration definitions by expanding template configuration
     * names based on matrix parameters, but does not evaluate the configuration
     * content or perform Liquid substitutions. The actual template evaluation
     * and variable substitution occur later when individual configurations are
     * initialised via {@link BuildConfiguration.initialise}, and only
     * for configurations that are actually used. This approach avoids unnecessary
     * operations on unused configurations.
     *
     * Processing steps:
     *
     * <ol>
     * <li>Return early if already initialised (idempotent behaviour).</li>
     * <li>Iterate through all build configuration definitions from the JSON
     *    object.</li>
     * <li>For template configurations (names containing <code>\{\{</code>):
     *   <ul>
     *   <li>Call <code>_processTemplate()</code> to expand and register all
     *      generated configurations.</li>
     *   </ul>
     * </li>
     * <li>For regular configurations:
     *   <ul>
     *   <li>Validate uniqueness of the configuration name.</li>
     *   <li>Register the configuration in internal maps with
     *      <code>undefined</code> value (lazy loading).</li>
     *   </ul>
     * </li>
     * <li>Cache the array of all configuration names for efficient repeated
     *    access.</li>
     * </ol>
     *
     * @returns A promise that resolves to `true` if initialisation was performed,
     * or `false` if already initialised.
     *
     * @throws {@link ConfigurationError}
     * If duplicate names are detected or template expansion fails.
     */
    initialise(): Promise<boolean>;
    /**
     * The number of build configurations in the collection.
     *
     * @remarks
     * This value is known only after `initialise()`.
     *
     * This getter provides direct access to the collection size, enabling
     * callers to check for emptiness or iterate with knowledge of the
     * collection's extent.
     *
     * @returns The number of build configurations in the collection.
     */
    get size(): number;
    /**
     * Indicates whether the collection is empty.
     *
     * @remarks
     * This value is known only after `initialise()`.
     *
     * @returns `true` if there are no build configurations, `false` otherwise.
     */
    get isEmpty(): boolean;
    /**
     * The names of all build configurations.
     *
     * @remarks
     * This value is known only after `initialise()`.
     *
     * This getter returns the cached array of configuration names for
     * efficient repeated access without recreating the array.
     *
     * @returns An array of build configuration names.
     */
    get names(): string[];
    /**
     * Retrieves the JSON configuration name for a build configuration.
     *
     * @param buildConfigurationName - The build configuration name to resolve.
     * @returns The JSON configuration name associated with the given build
     * configuration name.
     *
     * @remarks
     * For template-generated configurations, this returns the template
     * name.
     *
     * @throws {@link InputError}
     * If the build configuration does not exist.
     */
    getJsonName(buildConfigurationName: string): string;
    /**
     * Determines whether a JSON definition exists for a build configuration.
     *
     * @param buildConfigurationName - The build configuration name to check.
     * @returns `true` if a JSON definition exists, `false` otherwise.
     */
    hasJson(buildConfigurationName: string): boolean;
    /**
     * Retrieves the JSON build configuration definition.
     *
     * @param buildConfigurationName - The build configuration name to resolve.
     * @returns The JSON build configuration definition.
     */
    getJson(buildConfigurationName: string): JsonBuildConfiguration;
    /**
     * Determines whether a build configuration is hidden.
     *
     * @param buildConfigurationName - The build configuration name to check.
     * @returns `true` if the configuration is hidden, `false` otherwise.
     */
    isHidden(buildConfigurationName: string): boolean;
    /**
     * Determines whether a build configuration exists in the collection.
     *
     * @param buildConfigurationName - The build configuration name to check.
     * @returns `true` if the configuration exists, `false` otherwise.
     */
    has(buildConfigurationName: string): boolean;
    /**
     * Retrieves a build configuration by name, creating it if required.
     *
     * @remarks
     * This method implements lazy evaluation to avoid unnecessary
     * operations. Build configurations are instantiated on demand but
     * remain uninitialised until actually used.
     *
     * Retrieval process:
     *
     * <ol>
     * <li>Check if the configuration already exists in the internal map.</li>
     * <li>If found and already instantiated, return the existing instance.</li>
     * <li>If the configuration name is unknown (not in JSON name mapping),
     *    throw <code>InputError</code>.</li>
     * <li>For known but not yet instantiated configurations:
     *   <ul>
     *   <li>Resolve the original JSON configuration name (handles both
     *      regular and template-generated configurations).</li>
     *   <li>Retrieve the JSON configuration definition.</li>
     *   <li>Create a new <code>BuildConfiguration</code> instance.</li>
     *   <li>Store the instance in the map for future access.</li>
     *   </ul>
     * </li>
     * <li>Return the configuration instance (still uninitialised).</li>
     * </ol>
     *
     * The two-step lazy evaluation process:
     *
     * <ol>
     * <li>During collection initialisation
     *    (<code>BuildConfigurations.initialise()</code>), only the
     *    matrix of options is evaluated for each template, expanding
     *    configuration names without processing their content.</li>
     * <li>Later, when a configuration is accessed via this method and
     *    subsequently initialised
     *    (<code>BuildConfiguration.initialise()</code>), the template
     *    is fully evaluated and Liquid substitutions are performed on
     *    all properties.</li>
     * </ol>
     *
     * This approach ensures that only build configurations that are
     * actually used incur the cost of template evaluation and variable
     * substitution.
     *
     * @param buildConfigurationName - The build configuration name to retrieve.
     * @returns The build configuration instance.
     *
     * @throws {@link InputError}
     * If a configuration with the specified name does not exist.
     */
    get(buildConfigurationName: string): BuildConfiguration;
    /**
     * Processes a template build configuration by expanding it and registering
     * the generated configurations.
     *
     * @remarks
     * This helper method is called during collection initialisation for each
     * build configuration whose name contains template syntax
     * (<code>\{\{</code> markers).
     *
     * Processing steps:
     *
     * <ol>
     * <li>Calls <code>_expandTemplateBuildConfigurations()</code> to generate
     *    all configuration instances from the template's matrix parameters.</li>
     * <li>Validates that each expanded configuration name is unique and does
     *    not conflict with existing configurations.</li>
     * <li>Registers each expanded configuration in the internal maps:
     *   <ul>
     *   <li><code>_buildConfigurationsMap</code>: Maps name to configuration
     *      instance.</li>
     *   <li><code>_jsonBuildConfigurationsNamesMap</code>: Maps expanded name
     *      back to original template name.</li>
     *   <li><code>_namesSet</code>: Tracks all registered
     *      names for duplicate detection.</li>
     *   </ul>
     * </li>
     * </ol>
     *
     * @param buildConfigurationName - The template configuration name
     * containing Liquid variables.
     * @param jsonBuildConfiguration - The JSON template definition containing
     * matrix parameters and a configuration template.
     * @returns A promise that resolves when processing is complete.
     *
     * @throws {@link ConfigurationError}
     * If duplicate configuration names are detected during expansion or if
     * template expansion fails.
     */
    protected _processTemplate({ buildConfigurationName, jsonBuildConfigurationTemplate, }: {
        buildConfigurationName: string;
        jsonBuildConfigurationTemplate: JsonBuildConfigurationTemplate;
    }): Promise<void>;
    /**
     * Expands a template build configuration into multiple configurations.
     *
     * @remarks
     * This method uses the {@link TemplateExpander} to compute the Cartesian
     * product of matrix parameter values and creates a configuration for each
     * combination, substituting matrix values into both the configuration name
     * and content.
     *
     * Processing steps:
     *
     * <ol>
     * <li>Validates matrix and template structure.</li>
     * <li>Delegates to <code>TemplateExpander</code> for matrix processing and
     *    name expansion.</li>
     * <li>Creates configuration instances via factory callback for each
     *    combination.</li>
     * </ol>
     *
     * Matrix variables are scoped to individual configurations and accessible
     * via the `matrix` namespace during property, dependency, and action
     * evaluation.
     *
     * @param buildConfigurationName - The template configuration name containing
     * Liquid variables.
     * @param jsonBuildConfigurationTemplate - The template definition containing
     * matrix parameters and a configuration template.
     * @returns A promise that resolves to a map of expanded configuration names
     * to their corresponding instances.
     *
     * @throws {@link ConfigurationError}
     * If the matrix structure is invalid or substitution fails.
     */
    protected _expandTemplateBuildConfigurations({ buildConfigurationName, jsonBuildConfigurationTemplate, }: {
        buildConfigurationName: string;
        jsonBuildConfigurationTemplate: JsonBuildConfigurationTemplate;
    }): Promise<Map<string, BuildConfiguration>>;
}
/**
 * Configuration parameters for constructing a build configuration instance.
 *
 * @remarks
 * This interface defines the required configuration for creating an
 * instance of {@link BuildConfiguration}. Most properties are mandatory
 * except for the optional <code>templateBuildConfigurationName</code> and
 * <code>matrixParameters</code>, which are only needed for template-generated
 * configurations created from matrix expansion.
 *
 * The parameters provide the configuration with its identity (name,
 * optional template name), the JSON configuration definition, access to
 * the parent collection for shared resources, and optional matrix parameter
 * values for template-generated configurations.
 */
export interface BuildConfigurationConstructorParameters {
    /**
     * The configuration name after substitution.
     */
    buildConfigurationName: string;
    /**
     * The template configuration name, if derived from a template.
     */
    templateBuildConfigurationName?: string;
    /**
     * The JSON configuration definition.
     */
    jsonBuildConfiguration: JsonBuildConfigurationContent;
    /**
     * The parent configurations collection.
     */
    parentBuildConfigurations: BuildConfigurations;
    /**
     * Optional matrix parameter values for template-generated configurations.
     */
    matrixParameters?: LiquidSubstitutionsStrings;
}
/**
 * An individual <b>xpm</b> build configuration.
 *
 * @remarks
 * Build configurations are initialised lazily and may inherit
 * properties, dependencies, and actions from other configurations.
 *
 * A configuration can exist in three states:
 *
 * <ol>
 * <li><b>Undefined:</b> Name is known but instance not yet created.</li>
 * <li><b>Instantiated:</b> Object exists but not yet fully processed.</li>
 * <li><b>Initialised:</b> Inheritance resolved, properties evaluated,
 *    dependencies substituted, and actions prepared.</li>
 * </ol>
 *
 * Inheritance is processed recursively with circular reference detection.
 * Later inherited properties override earlier ones, and local properties
 * override all inherited ones. Dependencies and actions are merged from
 * all inherited configurations.
 */
export declare class BuildConfiguration {
    /**
     * The build configuration name after substitution.
     *
     * @remarks
     * This is the final, expanded configuration name used for identification
     * and selection. For template-generated configurations, this is the
     * concrete name after matrix substitution (e.g., `release-x64` rather than
     * `release-{{ matrix.arch }}`).
     *
     * The name is used for:
     *
     * <ol>
     * <li>User-facing identification when listing or selecting
     *   configurations.</li>
     * <li><b>Build folder path generation (default:</b>
     *   <code>build/\{name\}</code>).</li>
     * <li>Logging and diagnostic output to track configuration lifecycle.</li>
     * <li>Inheritance references from other configurations.</li>
     * </ol>
     *
     * Names must be unique within the configurations collection, enforced
     * during {@link BuildConfigurations.initialise}.
     */
    readonly name: string;
    /**
     * The template build configuration name, if derived from a template.
     *
     * @remarks
     * For template-generated configurations, this preserves the original
     * template name containing Liquid variables (e.g.,
     * `release-{{ matrix.arch }}`), while `buildConfigurationName` holds the
     * expanded concrete name.
     *
     * Usage:
     *
     * <ol>
     * <li>Undefined for regular (non-template) configurations.</li>
     * <li>Set to the template name for configurations generated from matrix
     *    expansion.</li>
     * <li>Used to determine whether full JSON substitution is needed during
     *    initialisation (templates require complete substitution, regular
     *    configurations only substitute specific fields).</li>
     * <li>Enables tracing and debugging of template expansion process.</li>
     * </ol>
     */
    readonly templateName?: string;
    /**
     * The parent build configurations collection.
     *
     * @remarks
     * This reference maintains the hierarchical relationship between
     * individual configurations and their containing collection, providing
     * essential context for configuration initialisation.
     *
     * The parent collection provides access to:
     *
     * <ol>
     * <li>Liquid templating engine for variable substitution.</li>
     * <li>Base substitution variables hierarchy (package metadata,
     *    environment, platform detection).</li>
     * <li>Logger instance for diagnostic output.</li>
     * <li>JSON build configurations lookup for inheritance resolution.</li>
     * <li>Other configuration instances when processing inheritance chains.</li>
     * </ol>
     *
     * This design enables configurations to access shared resources without
     * duplicating them, while supporting complex inheritance relationships
     * where configurations reference and inherit from each other.
     */
    readonly parentBuildConfigurations: BuildConfigurations;
    /**
     * The list of inherited configuration names.
     *
     * @remarks
     * This array specifies the inheritance chain for this configuration,
     * processed sequentially during initialisation with later entries
     * overriding earlier ones.
     *
     * Inheritance processing:
     *
     * <ol>
     * <li>Populated from <code>inherits</code> or deprecated
     *    <code>inherit</code> field during
     *    initialisation.</li>
     * <li>Supports both string (single parent) and array (multiple parents)
     *    formats.</li>
     * <li>Each inherited configuration is initialised recursively before
     *    merging its properties, dependencies, and actions.</li>
     * <li>Circular references are detected and rejected with
     *    <code>InputError</code>.</li>
     * <li>Later inherited configurations override properties from earlier
     *    ones, and local properties override all inherited ones.</li>
     * </ol>
     */
    inheritsNames: string[];
    /**
     * Indicates whether the configuration is hidden.
     *
     * @remarks
     * Hidden configurations are used for inheritance bases or intermediate
     * configurations that shouldn't be directly selected for building.
     *
     * Effects of hidden status:
     *
     * <ol>
     * <li>Hidden configurations don't compute build folder relative paths
     *    during initialisation (optimization for inheritance-only configs).</li>
     * <li>May be excluded from user-facing configuration lists depending on
     *    application logic.</li>
     * <li>Still fully initialised and available for inheritance by other
     *    configurations.</li>
     * <li>Derived from <code>hidden</code> field in JSON configuration definition
     *    (defaults to <code>false</code>).</li>
     * </ol>
     *
     * Common use case:
     *
     * Base configurations that define common properties,
     * dependencies, or actions inherited by multiple concrete configurations.
     */
    readonly isHidden: boolean;
    /**
     * The resolved properties for this configuration.
     *
     * @remarks
     * This object contains the final merged properties after inheritance
     * resolution and becomes available in the `properties` namespace for
     * Liquid template substitution.
     *
     * Property resolution order:
     *
     * <ol>
     * <li>Start with empty object.</li>
     * <li>Merge properties from each inherited configuration in sequence
     *    (later overrides earlier).</li>
     * <li>Merge local properties from JSON definition (overrides all
     *    inherited).</li>
     * <li>Add computed <code>buildFolderRelativePath</code> property
     *    for non-hidden
     *    configurations.</li>
     * </ol>
     *
     * Properties are accessible in templates as `{{ properties.key }}` and
     * commonly used for compiler flags, toolchain paths, optimization
     * settings, and build-specific configuration values.
     */
    properties: LiquidSubstitutionsStrings;
    /**
     * The resolved dependencies after substitutions.
     *
     * @remarks
     * This object contains the final merged dependencies after inheritance
     * resolution and Liquid template substitution.
     *
     * Dependency resolution workflow:
     *
     * <ol>
     * <li>Start with empty object.</li>
     * <li>Merge <code>dependencies</code> from each inherited configuration
     *    in sequence
     *    (later overrides earlier).</li>
     * <li>Merge local <code>dependencies</code> from JSON definition.</li>
     * <li>Perform Liquid template substitution on the entire
     *    <code>dependencies</code>
     *    object with full configuration context (properties, matrix, etc.).</li>
     * </ol>
     *
     * This enables configuration-specific dependencies with dynamic version
     * ranges or package selection based on matrix parameters, platform
     * detection, or configuration properties.
     */
    dependencies: JsonDependencies;
    /**
     * The resolved development dependencies after substitutions.
     *
     * @remarks
     * This object contains the final merged development dependencies after
     * inheritance resolution and Liquid template substitution.
     *
     * Resolution workflow mirrors `dependencies`:
     *
     * <ol>
     * <li>Start with empty object.</li>
     * <li>Merge <code>devDependencies</code> from each inherited configuration
     *    in sequence
     *    (later overrides earlier).</li>
     * <li>Merge local <code>devDependencies</code> from JSON definition.</li>
     * <li>Perform Liquid template substitution on the entire
     *    <code>devDependencies</code>
     *    object with full configuration context.</li>
     * </ol>
     *
     * Typical use: Test frameworks, build tools, or debugging utilities
     * specific to certain configurations (e.g., debug builds might include
     * additional analysis tools).
     */
    devDependencies: JsonDependencies;
    /**
     * The JSON build configuration content from package metadata.
     *
     * @remarks
     * This holds the raw configuration definition as it appears in
     * `package.json`, before inheritance resolution and variable substitution.
     *
     * The definition is preserved to:
     *
     * <ol>
     * <li>Enable external modification (e.g., <code>xpm uninstall</code>
     *    updates this
     *    directly).</li>
     * <li>Support deferred template evaluation during
     *    <code>BuildConfiguration.initialise()</code>.</li>
     * <li>Provide the source for inheritance when other configurations
     *    reference this one.</li>
     * <li>Allow re-evaluation with different variable contexts if needed.</li>
     * </ol>
     *
     * This immutable storage ensures configurations can be safely referenced
     * during inheritance resolution without side effects.
     */
    jsonBuildConfiguration: JsonBuildConfigurationContent;
    /**
     * Indicates whether this configuration originates from a template.
     *
     * @remarks
     * This flag determines the substitution strategy during configuration
     * initialisation, with template configurations requiring more extensive
     * processing.
     *
     * Template vs regular configuration processing:
     *
     * <ol>
     * <li>Template configurations (<code>isTemplate === true</code>):
     *   <ul>
     *   <li>Entire JSON configuration is stringified and substituted.</li>
     *   <li>Matrix parameters available throughout all fields.</li>
     *   <li>More expensive but supports matrix references anywhere.</li>
     *   </ul>
     * </li>
     * <li>Regular configurations (<code>isTemplate === false</code>):
     *   <ul>
     *   <li>Only <code>inherits</code> field is substituted initially.</li>
     *   <li>Other fields processed selectively during inheritance
     *     resolution.</li>
     *   <li>More efficient for configurations without matrix parameters.</li>
     *   </ul>
     * </li>
     * </ol>
     *
     * Set to `true` when `templateBuildConfigurationName` is defined,
     * indicating the configuration was generated from a template expansion.
     */
    isTemplate: boolean;
    /**
     * The logger instance for output and diagnostics.
     *
     * @remarks
     * This logger provides trace-level diagnostics throughout the build
     * configuration lifecycle, including template substitution, inheritance
     * resolution, property merging, dependency substitution, and action
     * preparation.
     *
     * It is initialised in the constructor from the parent collection's logger
     * and used consistently across all helper methods to maintain coherent
     * logging output. This enables detailed debugging of complex configuration
     * hierarchies without impacting runtime performance when tracing is
     * disabled.
     */
    protected readonly _log: Logger;
    /**
     * The variables used for substitution in this configuration.
     *
     * @remarks
     * This extended variable hierarchy combines the base collection variables
     * with configuration-specific context, enabling accurate template
     * evaluation.
     *
     * Extension hierarchy:
     *
     * <ol>
     * <li>Starts with parent collection's base variables (env, os, path,
     *    package).</li>
     * <li>Extended with <code>properties</code>: Merged from inheritance
     *    chain and local
     *    properties.</li>
     * <li>Extended with <code>matrix</code>: Parameter values for
     *    template-generated
     *    configurations.</li>
     * <li>Extended with <code>configuration</code>: The configuration
     *    object itself
     *    (name, dependencies, properties) accessible for self-reference.</li>
     * </ol>
     *
     * This complete context is used for all substitutions within the
     * configuration: properties, dependencies, devDependencies, and actions.
     */
    protected _substitutionsVariables: LiquidSubstitutionsVariables;
    /**
     * The matrix parameter values for template-generated configurations.
     *
     * @remarks
     * For template-generated configurations, this object contains the specific
     * matrix parameter values that produced this configuration instance from
     * the template.
     *
     * Usage pattern:
     *
     * <ol>
     * <li>Undefined for regular (non-template) configurations.</li>
     * <li>For template configurations, contains key-value pairs from the matrix
     *    combination (e.g.,
     *   <code>\{ arch: 'x64', optimize: 'speed' \}</code>).</li>
     * <li>Merged into substitution variables during initialisation, making
     *    values accessible via the <code>matrix</code> namespace throughout the
     *    configuration.</li>
     * <li>Used in configuration name substitution, property values,
     *    dependencies, and action commands.</li>
     * </ol>
     *
     * Example: A template `release-{{ matrix.arch }}` with matrix parameters
     * `{ arch: 'x64' }` becomes the concrete configuration `release-x64`.
     */
    protected readonly matrixParameters?: LiquidSubstitutionsStrings;
    /**
     * The actions associated with this build configuration.
     *
     * @remarks
     * This actions collection is created during configuration initialisation
     * and combines inherited actions with local action definitions.
     *
     * Action assembly workflow:
     *
     * <ol>
     * <li>Undefined until <code>BuildConfiguration.initialise()</code> is
     *    called.</li>
     * <li>Collect actions from all inherited configurations in the inheritance
     *    chain.</li>
     * <li>Create new <code>Actions</code> collection with inherited
     *    actions map and local action definitions.</li>
     * <li>Actions inherit the configuration's substitution variables context,
     *    including properties and matrix parameters.</li>
     * </ol>
     *
     * Actions are accessible after configuration initialisation but remain
     * themselves uninitialised until retrieved and initialised individually,
     * maintaining the lazy evaluation pattern.
     */
    protected _actions: Actions | undefined;
    /**
     * The resolved build folder relative path.
     *
     * @remarks
     * This path specifies where build outputs for this configuration should be
     * placed, computed during initialisation and added back to properties for
     * use in subsequent substitutions.
     *
     * Computation workflow:
     *
     * <ol>
     * <li>Undefined until <code>BuildConfiguration.initialise()</code> is
     *    called.</li>
     * <li>Not computed for hidden configurations (optimization).</li>
     * <li>If <code>buildFolderRelativePath</code> property exists, perform Liquid
     *    substitution with full configuration context.</li>
     * <li>Otherwise, generate default path:
     *    <code>build/\{sanitized-config-name\}</code>.</li>
     * <li>Added to <code>properties.buildFolderRelativePath</code> for use
     *    in action
     *    commands and dependency references.</li>
     * </ol>
     *
     * The path is relative to the package root and used by build tools to
     * organize outputs from different configurations.
     */
    protected _buildFolderRelativePath?: string;
    /**
     * Set of inherited configuration names for circular reference detection.
     *
     * @remarks
     * This set tracks the inheritance chain being processed to detect and
     * prevent circular inheritance references.
     *
     * Detection mechanism:
     *
     * <ol>
     * <li>Initially empty when configuration initialisation begins.</li>
     * <li>Each inherited configuration name is added before processing that
     *    configuration's inheritance.</li>
     * <li>If a configuration attempts to inherit from a name already in the
     *    set, a circular reference exists.</li>
     * <li>Circular references trigger <code>InputError</code> with details
     * about    the problematic inheritance chain.</li>
     * </ol>
     *
     * Example: If config A inherits from B, B from C, and C from A, the
     * circular dependency is detected when C attempts to inherit from A.
     */
    protected _inheritedNamesSet: Set<string>;
    /**
     * Flag indicating whether the configuration has been initialised.
     *
     * @remarks
     * This flag ensures idempotent initialization and prevents redundant
     * processing when {@link BuildConfiguration.initialise} is called
     * multiple times.
     *
     * State transitions:
     *
     * <ol>
     * <li>Initially <code>false</code> after construction.</li>
     * <li>Set to <code>true</code> after successful inheritance resolution,
     *    property
     *    merging, dependency substitution, and action preparation.</li>
     * <li>Checked at the start of
     *    <code>BuildConfiguration.initialise()</code> to return early if
     *    already initialised.</li>
     * </ol>
     *
     * This pattern is critical for inheritance processing, as configurations
     * may be initialised multiple times when referenced by multiple children,
     * but should only process their inheritance chain once.
     */
    protected _isInitialised: boolean;
    /**
     * Constructs a build configuration instance.
     *
     * @param buildConfigurationName - The configuration name after substitution.
     * @param templateBuildConfigurationName - The template configuration name, if
     * derived from a template.
     * @param jsonBuildConfiguration - The JSON configuration definition.
     * @param parentBuildConfigurations - The parent configurations collection.
     * @param matrixParameters - Optional matrix parameter values for
     * template-generated configurations.
     *
     * @remarks
     * The constructor performs partial initialisation. Full initialisation
     * requires calling {@link BuildConfiguration.initialise}.
     */
    constructor({ buildConfigurationName, templateBuildConfigurationName, jsonBuildConfiguration, parentBuildConfigurations, matrixParameters, }: BuildConfigurationConstructorParameters);
    /**
     * Completes the async initialisation of the build configuration.
     *
     * @remarks
     * This method resolves inheritance, applies variable substitutions,
     * computes dependencies, and prepares actions.
     *
     * Initialisation workflow:
     *
     * <ol>
     * <li>Return early if already initialised (idempotent behaviour).</li>
     * <li>For template configurations: Call
     *    <code>_substituteTemplate()</code> to substitute
     *    matrix parameters throughout the entire JSON structure.</li>
     * <li>For non-template configurations: Call
     *    <code>_substituteInherits()</code> to substitute
     *    only the inherits field.</li>
     * <li>Call <code>_processInherits()</code> to:
     *   <ul>
     *   <li>Process inheritance chain recursively with circular reference
     *      detection.</li>
     *   <li>Merge properties, dependencies, and devDependencies from inherited
     *      configurations (later overrides earlier).</li>
     *   <li>Collect inherited actions into a map.</li>
     *   </ul>
     * </li>
     * <li>Apply local properties and update substitution variables context.</li>
     * <li>For visible configurations: Compute build folder relative path via
     *    <code>_getBuildFolderRelativePath()</code>.</li>
     * <li>Substitute Liquid templates in dependencies and devDependencies.</li>
     * <li>Create actions collection with inherited actions and local
     * actions.</li>
     * </ol>
     *
     * The substitution context includes package variables, configuration
     * properties, matrix parameters (for templates), and the configuration
     * object itself accessible via `configuration.name`, etc.
     *
     * @returns A promise that resolves to `true` if initialisation was performed,
     * or `false` if already initialised.
     *
     * @throws {@link ConfigurationError}
     * If substitutions fail.
     *
     * @throws {@link InputError}
     * If inheritance references are invalid or circular.
     */
    initialise(): Promise<boolean>;
    /**
     * Retrieves the actions collection for this build configuration.
     *
     * @returns The actions collection.
     */
    get actions(): Actions;
    /**
     * Retrieves the build folder relative path for this configuration.
     *
     * @returns The build folder relative path.
     */
    get buildFolderRelativePath(): string;
    /**
     * Performs template substitution on the entire build configuration JSON.
     *
     * @remarks
     * This method is invoked during initialisation for template-generated
     * configurations to substitute matrix parameters throughout the entire
     * configuration definition.
     *
     * Processing steps:
     *
     * <ol>
     * <li>Stringify the entire JSON build configuration object.</li>
     * <li>Check if the stringified JSON contains template syntax
     *    (<code>\{\{</code> or <code>\{%</code>).</li>
     * <li>If templates are found:
     *   <ul>
     *   <li>Perform Liquid substitutions with complete variable context
     *      including matrix parameters.</li>
     *   <li>Parse the substituted JSON string back into an object.</li>
     *   </ul>
     * </li>
     * <li>If no templates are found, return the original configuration
     *    as-is.</li>
     * </ol>
     *
     * This comprehensive substitution approach ensures matrix parameters can
     * be referenced anywhere within the configuration (properties, dependencies,
     * actions, etc.), which is necessary for template-generated configurations
     * but would be unnecessarily expensive for regular configurations.
     *
     * @returns A promise that resolves to the build configuration content with
     * all template variables substituted.
     *
     * @throws {@link ConfigurationError}
     * If Liquid template substitution fails.
     */
    protected _substituteTemplate(): Promise<JsonBuildConfigurationContent>;
    /**
     * Performs selective substitution on the inherits field only.
     *
     * @remarks
     * This method is invoked during initialisation for regular (non-template)
     * configurations to substitute template variables in the inheritance
     * specification whilst leaving other fields untouched until later processing.
     *
     * Processing steps:
     *
     * <ol>
     * <li>Extract the <code>inherits</code> (or deprecated
     *    <code>inherit</code>) field from the
     *    configuration.</li>
     * <li>Stringify the inherits field and check for template syntax
     *    (<code>\{\{</code> or <code>\{%</code>).</li>
     * <li>If templates are found:
     *   <ul>
     *   <li>Perform Liquid substitutions with current variable context.</li>
     *   <li>Parse the substituted JSON string back into an object.</li>
     *   <li>Return a new configuration object with the substituted inherits
     *      field and all other fields unchanged.</li>
     *   </ul>
     * </li>
     * <li>If no templates are found, return the original configuration
     *    as-is.</li>
     * </ol>
     *
     * This selective approach is more efficient than full JSON substitution
     * for regular configurations that do not have matrix parameters. The
     * remaining fields (properties, dependencies, actions) are processed
     * during inheritance resolution and dependency substitution phases.
     *
     * @returns A promise that resolves to the build configuration content with
     * the inherits field substituted.
     *
     * @throws {@link ConfigurationError}
     * If Liquid template substitution fails on the inherits field.
     */
    protected _substituteInherits(): Promise<JsonBuildConfigurationContent>;
    /**
     * Parses the inherits field from JSON configuration.
     *
     * @remarks
     * This helper method extracts and normalises inheritance information from
     * the configuration, supporting both the current <code>inherits</code>
     * field and the deprecated <code>inherit</code> field. It handles both
     * string and array formats.
     *
     * Processing steps:
     *
     * <ol>
     * <li>Check for <code>inherits</code> field (current standard).</li>
     * <li>Fall back to <code>inherit</code> field (deprecated).</li>
     * <li>Convert single strings to single-element arrays.</li>
     * <li>Join array elements with line breaks and split to handle
     *    multi-line strings.</li>
     * </ol>
     *
     * @param localJsonBuildConfiguration - The JSON configuration content.
     * @returns Array of inherited configuration names.
     */
    private _parseInheritsField;
    /**
     * Processes and merges a single inherited configuration.
     *
     * @remarks
     * This helper method handles the initialisation of a single inherited
     * configuration and merges its properties, dependencies, and actions into
     * the current configuration.
     *
     * Processing steps:
     *
     * <ol>
     * <li>Detect circular references by checking the inherited names set.</li>
     * <li>Initialise the inherited configuration recursively.</li>
     * <li>Merge properties, dependencies, and devDependencies using spread
     *    operator (later values override earlier ones).</li>
     * <li>Collect inherited actions into the provided map.</li>
     * </ol>
     *
     * @param inheritedBuildConfigurationName - Name of the configuration to
     * inherit from.
     * @param inheritedActionsMap - Map to accumulate inherited actions.
     * @returns A promise that resolves when processing is complete.
     *
     * @throws {@link InputError}
     * If a circular inheritance reference is detected.
     *
     * @throws {@link InputError}
     * If the inherited configuration name does not exist.
     */
    private _processInheritedConfiguration;
    /**
     * Processes inheritance for a build configuration.
     *
     * @remarks
     * This method implements the inheritance resolution mechanism for build
     * configurations, enabling configurations to share properties, dependencies,
     * and actions by inheriting from one or more base configurations,
     * recursively.
     *
     * Processing workflow:
     *
     * <ol>
     * <li>Extract inheritance specification from the configuration:
     *   <ul>
     *   <li>Supports both the current <code>inherits</code> field and the
     *      deprecated <code>inherit</code> field for backwards
     *      compatibility.</li>
     *   <li>Handles both string format (single parent) and array format
     *      (multiple parents).</li>
     *   <li>Normalises line-separated names within array elements to support
     *      multi-line specifications.</li>
     *   </ul>
     * </li>
     * <li>Process each inherited configuration sequentially:
     *   <ul>
     *   <li>Skip empty names from the inheritance list.</li>
     *   <li>Validate that the inherited configuration exists in the parent
     *      collection.</li>
     *   <li>Detect circular references by checking
     *      <code>_inheritedNamesSet</code>.</li>
     *   <li>Recursively initialise the inherited configuration (which may
     *      itself have inheritance).</li>
     *   </ul>
     * </li>
     * <li>Merge inherited content into the current configuration:
     *   <ul>
     *   <li>Properties: Later inherited configurations override earlier ones,
     *      local properties override all inherited.</li>
     *   <li>Dependencies and devDependencies: Same override behaviour as
     *      properties.</li>
     *   <li>Actions: Collected into a map where later definitions override
     *      earlier ones with the same name.</li>
     *   </ul>
     * </li>
     * </ol>
     *
     * The inheritance chain is processed depth-first, ensuring that transitive
     * inheritance (A inherits B, B inherits C) is fully resolved before merging
     * properties. Circular references are detected to prevent infinite recursion.
     *
     * @param localJsonBuildConfiguration - The JSON configuration content after
     * template or inherits field substitution.
     * @returns A promise that resolves to a map of inherited actions, where
     * keys are action names and values are action instances from all inherited
     * configurations.
     *
     * @throws {@link InputError}
     * If an inherited configuration name does not exist in the parent collection.
     *
     * @throws {@link InputError}
     * If a circular inheritance reference is detected.
     */
    protected _processInherits(localJsonBuildConfiguration: JsonBuildConfigurationContent): Promise<Map<string, Action>>;
    /**
     * Computes the build folder relative path for this configuration.
     *
     * @remarks
     * This method resolves the build folder relative path property when
     * provided and uses a default value based on the configuration name
     * otherwise.
     *
     * Resolution strategy:
     *
     * <ol>
     * <li>Check if buildFolderRelativePath property exists in configuration
     *    properties.</li>
     * <li>If present and non-empty, perform Liquid substitutions with the
     *    full configuration context.</li>
     * <li>If substitution fails or property is empty/missing, generate a
     *    default path: `build/{filtered-configuration-name}` where the
     *    configuration name is sanitized for filesystem compatibility.</li>
     * </ol>
     *
     * The computed path is added back to the properties as
     * `buildFolderRelativePath` for use in subsequent substitutions.
     *
     * @returns A promise that resolves to the build folder relative path.
     */
    protected _getBuildFolderRelativePath(): Promise<string>;
}
//# sourceMappingURL=build-configurations.d.ts.map