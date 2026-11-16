import { Logger } from '@xpack/logger';
import { LiquidSubstitutionsVariables } from '../data/substitutions-variables.js';
import { Actions } from './actions.js';
import { BuildConfigurations } from './build-configurations.js';
import { LiquidEngine } from './liquid-engine.js';
import { JsonXpmPackage } from '../types/json.js';
/**
 * The property name used for the build folder relative path.
 */
export declare const buildFolderRelativePathPropertyName = "buildFolderRelativePath";
/**
 * Configuration parameters for constructing a data model instance.
 *
 * @remarks
 * This interface defines the required configuration for creating an
 * instance of {@link DataModel}. Both properties are mandatory.
 *
 * The parameters provide the parsed <code>package.json</code> content
 * containing package metadata and <b>xpm</b>-specific configuration, along
 * with the logger for diagnostic output during data model initialization
 * and template processing.
 */
export interface DataModelConstructorParameters {
    /**
     * The JSON package definition.
     */
    jsonPackage: JsonXpmPackage;
    /**
     * The logger instance for output and diagnostics.
     */
    log: Logger;
}
/**
 * Represents a lazy-loading data model for an <b>xpm</b> package.
 *
 * @remarks
 * This class prepares substitution variables, creates the Liquid
 * engine, and exposes actions and build configurations defined in the package.
 *
 * The package processor serves as the top-level coordinator for all
 * Liquid-based template processing in an <b>xpm</b> package. It establishes the
 * foundation for variable substitution throughout the package hierarchy:
 *
 * <ol>
 * <li>Initializes base substitution variables (platform detection, system
 *    information, etc.).</li>
 * <li>Adds package-specific variables from <code>package.json</code>
 *     metadata.</li>
 * <li>Merges user-defined properties from <code>xpack.properties</code>.</li>
 * <li>Creates package-level actions accessible across all contexts.</li>
 * <li>Creates build configurations, each inheriting the base substitution
 *    context and adding configuration-specific variables.</li>
 * </ol>
 *
 * This hierarchical structure ensures that templates at any level have
 * access to appropriate variables while maintaining clear scoping rules.
 * Package-level actions are available globally, while configuration-level
 * actions are scoped to their respective configurations.
 */
export declare class DataModel {
    /**
     * The variables available for Liquid substitutions.
     *
     * @remarks
     * This sealed object provides the base substitution context inherited by
     * all actions and build configurations within the package.
     *
     * Variable hierarchy:
     *
     * <ol>
     * <li><b>Base variables (xpmLiquidSubstitutionsVariablesBase):</b>
     *   <ul>
     *   <li><code>env</code>: Environment variables from process.env</li>
     *   <li><code>os</code>: Platform detection (platform, arch, endianness,
     *      version)</li>
     *   <li><code>path</code>: Path utilities (sep, delimiter, cwd)</li>
     *   </ul>
     * </li>
     * <li><b>Package metadata:</b>
     *   <ul>
     *   <li><code>package</code>: Complete <code>package.json</code> content
     *      (name, version,
     *      dependencies, etc.)</li>
     *   </ul>
     * </li>
     * <li><b>User-defined properties:</b>
     *   <ul>
     *   <li><code>properties</code>: Merged from
     *      <code>xpack.properties</code> if present</li>
     *   </ul>
     * </li>
     * </ol>
     *
     * The object is sealed after initialization to prevent accidental
     * modification. Child components (actions and configurations) extend this
     * context with their own scoped variables (configuration, matrix) without
     * modifying the original sealed object.
     */
    readonly substitutionsVariables: LiquidSubstitutionsVariables;
    /**
     * The actions collection for this package.
     *
     * @remarks
     * This collection manages package-level actions defined in
     * `xpack.actions`, which are globally accessible and not tied to specific
     * build configurations.
     *
     * Package-level actions characteristics:
     *
     * <ol>
     * <li>Created during construction but initially unpopulated.</li>
     * <li>Populated during the collection's own initialisation when
     *    <code>Actions.initialise()</code> is called.</li>
     * <li>Have access to package-level substitution variables but not
     *    configuration-specific variables.</li>
     * <li>Suitable for package-wide tasks like testing, documentation
     *    generation, or global cleanup.</li>
     * <li>Can be used alongside configuration-specific actions, which inherit
     *    from package-level actions.</li>
     * </ol>
     */
    readonly actions: Actions;
    /**
     * The build configurations collection for this package.
     *
     * @remarks
     * This collection manages all build configurations defined in
     * `xpack.buildConfigurations`, supporting inheritance, template expansion,
     * and configuration-specific properties and dependencies.
     *
     * Build configurations characteristics:
     *
     * <ol>
     * <li>Created during construction but initially unpopulated.</li>
     * <li>Populated during the collection's own initialisation when
     *    <code>BuildConfigurations.initialise()</code> is called.</li>
     * <li>Each configuration inherits the package-level substitution variables
     *    and extends them with configuration-specific context.</li>
     * <li>Support complex inheritance chains where configurations can inherit
     *    properties, dependencies, and actions from other configurations.</li>
     * <li>Can be generated from templates with matrix expansion for
     *    multi-platform or multi-variant builds.</li>
     * <li>Each configuration maintains its own actions collection, inheriting
     *    package-level actions and adding configuration-specific ones.</li>
     * </ol>
     */
    readonly buildConfigurations: BuildConfigurations;
    /**
     * The logger instance for output and diagnostics.
     *
     * @remarks
     * This logger provides trace-level diagnostics for the entire package
     * processing hierarchy, including Liquid engine creation, variable
     * initialization, action collection setup, and build configuration
     * preparation. It's passed down to child components (actions and build
     * configurations) to maintain consistent logging throughout the package
     * lifecycle.
     */
    protected readonly _log: Logger;
    /**
     * The Liquid engine used for substitutions.
     *
     * @remarks
     * This LiquidEngine instance is configured with strict mode and custom
     * filters for xpm-specific operations. It's shared across all actions and
     * build configurations within the package, ensuring consistent template
     * processing behavior.
     *
     * Engine characteristics:
     *
     * <ol>
     * <li>Strict mode enabled to catch undefined variable references.</li>
     * <li>Custom filters for platform detection (<code>isPlatform</code>,
     *    <code>isArch</code>).</li>
     * <li>Custom filters for path sanitization (<code>filterPath</code>,
     *    <code>filterPosixPath</code>,
     *    <code>filterWin32Path</code>).</li>
     * <li>Shared instance reduces memory overhead and ensures consistent
     *    template evaluation across all package components.</li>
     * </ol>
     */
    protected readonly _engine: LiquidEngine;
    /**
     * The JSON package definition.
     *
     * @remarks
     * This object contains the complete `package.json` content, including both
     * standard npm fields and xpm-specific extensions in the `xpack` section.
     *
     * Required structure:
     *
     * <ol>
     * <li>Standard npm fields: name, version, dependencies, devDependencies.</li>
     * <li>Required <code>xpack</code> section containing xpm-specific
     *    configuration.</li>
     * <li>Optional <code>xpack.properties</code> for user-defined
     *    substitution variables.</li>
     * <li>Optional <code>xpack.actions</code> for package-level executable
     *    actions.</li>
     * <li>Optional <code>xpack.buildConfigurations</code> for build configuration
     *    definitions.</li>
     * </ol>
     *
     * The package definition is validated during construction, requiring the
     * `xpack` section to be present and be a valid JSON object.
     */
    protected readonly _jsonPackage: JsonXpmPackage;
    /**
     * Constructs a Liquid package processor.
     *
     * @remarks
     * The constructor initializes the Liquid engine and prepares the
     * substitution variables context that will be inherited by all actions
     * and build configurations.
     *
     * Initialization sequence:
     *
     * <ol>
     * <li>Create <code>LiquidEngine</code> with custom filters and strict
     * configuration.</li>
     * <li>Validate <code>xpack</code> section exists in
     *    <code>package.json</code>.</li>
     * <li>Initialize base substitution variables (os, platform, arch, etc.).</li>
     * <li>Add package metadata to substitution context.</li>
     * <li>Merge <code>xpack.properties</code> if defined, allowing user-defined
     * variables.</li>
     * <li>Seal substitution variables to prevent accidental modification.</li>
     * <li>Create package-level actions collection (initially empty, populated
     *    during initialisation).</li>
     * <li>Create build configurations collection (initially empty, populated
     *    during initialisation).</li>
     * </ol>
     *
     * The substitution variables object is sealed to ensure immutability of
     * the base context. Individual actions and configurations will extend this
     * context with their own scoped variables without modifying the original.
     *
     * @param jsonPackage - The JSON package definition.
     * @param log - The logger instance for output and diagnostics.
     */
    constructor({ jsonPackage, log }: DataModelConstructorParameters);
}
//# sourceMappingURL=data-model.d.ts.map