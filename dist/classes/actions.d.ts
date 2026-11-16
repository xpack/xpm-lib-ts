import { Logger } from '@xpack/logger';
import { LiquidSubstitutionsVariables, LiquidSubstitutionsStrings } from '../data/substitutions-variables.js';
import { JsonActionContent, JsonActions, JsonActionTemplate } from '../types/json.js';
import { BuildConfiguration } from './build-configurations.js';
import { LiquidEngine } from './liquid-engine.js';
/**
 * Configuration parameters for constructing an actions collection instance.
 *
 * @remarks
 * This interface defines the required configuration for creating an
 * instance of {@link Actions}. Most properties are mandatory except for
 * the optional <code>inheritedActionsMap</code> and
 * <code>buildConfiguration</code> parameters.
 *
 * The parameters provide the actions collection with access to the Liquid
 * templating engine, substitution variables hierarchy, action definitions
 * from the package manifest, optional inherited actions from a parent
 * package, optional build configuration context, and the logger for
 * diagnostic output.
 */
export interface ActionsConstructorParameters {
    /**
     * The Liquid templating engine for variable substitution.
     */
    engine: LiquidEngine;
    /**
     * The variables available for substitution in action definitions.
     */
    substitutionsVariables: LiquidSubstitutionsVariables;
    /**
     * The JSON object containing action definitions, or undefined if there are
     * no actions.
     */
    jsonActions: JsonActions | undefined;
    /**
     * Optional map of actions inherited from a parent package.
     */
    inheritedActionsMap?: Map<string, Action>;
    /**
     * Optional build configuration this actions collection belongs to.
     */
    buildConfiguration?: BuildConfiguration;
    /**
     * The logger instance for output and diagnostics.
     */
    log: Logger;
}
/**
 * A collection of <b>xpm</b> actions for a build configuration or
 * the entire package.
 *
 * @remarks
 * This class manages a collection of named actions, each containing one or
 * more commands to be executed. Actions can belong to a package or a build
 * configuration and support template-based definitions with matrix expansion
 * to generate multiple actions from a single template.
 *
 * The collection always exists, even as empty if no actions are defined.
 *
 * Action lifecycle phases:
 *
 * <ol>
 * <li><b>Construction:</b> Basic setup with optional inheritance from parent
 *    package.</li>
 * <li><b>Initialisation:</b> Template name expansion without content
 *    evaluation.</li>
 * <li><b>Retrieval:</b> On-demand instantiation when accessed via
 *    <code>get()</code>.</li>
 * <li><b>Action Initialisation:</b> Liquid template evaluation and
 *    substitution.</li>
 * </ol>
 *
 * This multi-phase approach ensures efficient resource usage by deferring
 * expensive operations until actions are actually needed.
 */
export declare class Actions {
    /**
     * The logger instance for output and diagnostics.
     *
     * @remarks
     * This logger is used throughout the lifecycle of actions collection to
     * provide trace-level diagnostics for debugging template expansion, action
     * instantiation, and variable substitution. It enables visibility into the
     * lazy evaluation process without impacting runtime performance when tracing
     * is disabled.
     */
    readonly log: Logger;
    /**
     * The Liquid templating engine for variable substitution.
     *
     * @remarks
     * This engine instance is shared across all actions in the collection and
     * configured with custom filters for platform detection, path manipulation,
     * and xpm-specific operations. It's used during both template action name
     * expansion and later during individual action command substitution,
     * ensuring consistent template processing throughout the action lifecycle.
     */
    readonly engine: LiquidEngine;
    /**
     * The variables available for substitution in action definitions.
     *
     * @remarks
     * This comprehensive variable hierarchy provides context for template
     * evaluation, including package metadata, build configuration properties,
     * environment variables, platform detection, and path utilities.
     *
     * The hierarchy structure:
     *
     * <ol>
     * <li><b>Base variables:</b> <code>env</code>, <code>os</code>,
     *    <code>path</code> (always available).</li>
     * <li><b>Package variables:</b> <code>name</code>, <code>version</code>,
     *    <code>dependencies</code>,
     *    <code>devDependencies</code>.</li>
     * <li><b>Configuration variables:</b> build folder paths, compiler
     *    settings.</li>
     * <li><b>Properties:</b> custom key-value pairs from package or
     *    configuration.</li>
     * <li><b>Matrix:</b> parameter combinations for template-generated
     *    actions (added per action during initialisation).</li>
     * </ol>
     *
     * These variables are accessible in Liquid templates using dot notation
     * (e.g., `{{ package.name }}`,
     * `{{ configuration.buildFolderRelativePath }}`).
     */
    readonly substitutionsVariables: LiquidSubstitutionsVariables;
    /**
     * The JSON object containing action definitions from the package manifest.
     *
     * @remarks
     * This object holds the raw action definitions as they appear in the
     * `package.json` `xpack.actions` section or within a build configuration's
     * actions. Action definitions can be:
     *
     * <ol>
     * <li><b>Simple strings:</b> Single command to execute.</li>
     * <li><b>String arrays:</b> Multiple commands executed sequentially.</li>
     * <li><b>Template objects:</b> With <code>matrix</code> and
     *    <code>template</code> properties for
     *    generating multiple actions from a single definition.</li>
     * </ol>
     *
     * Template action names (containing `{{` markers) trigger matrix expansion
     * during initialisation, creating concrete actions from the Cartesian
     * product of matrix parameter values.
     */
    readonly jsonActions: JsonActions;
    /**
     * The build configuration this actions collection belongs to, if any.
     *
     * @remarks
     * This optional reference establishes the hierarchical relationship between
     * actions and build configurations, affecting variable substitution scope
     * and action inheritance.
     *
     * When defined:
     *
     * <ol>
     * <li>Actions inherit configuration-specific variables (build folder paths,
     *   compiler settings, toolchain properties).</li>
     * <li>Actions belong to a specific configuration namespace rather than the
     *   package root.</li>
     * <li>Logging and diagnostics include the configuration name for
     *   context.</li>
     * </ol>
     *
     * When `undefined`:
     *
     * <ol>
     * <li>Actions belong to the package root (<code>xpack.actions</code> in
     *    <code>package.json</code>).</li>
     * <li>Only package-level and global variables are available for
     *    substitution.</li>
     * </ol>
     */
    readonly buildConfiguration: BuildConfiguration | undefined;
    /**
     * Map of action names to their corresponding action instances.
     *
     * @remarks
     * This map serves as the primary action registry, populated during
     * collection initialisation with entries for all discovered actions.
     *
     * Key characteristics:
     *
     * <ol>
     * <li>Known only after <code>Actions.initialise()</code>
     *   completes.</li>
     * <li>Possibly empty if there are no actions defined.</li>
     * <li>Values can be <code>undefined</code> to indicate an action
     *   exists but hasn't
     *   been instantiated yet (lazy loading).</li>
     * <li>For template actions, contains one entry per expanded combination,
     *   not the original template definition.</li>
     * </ol>
     *
     * Actions transition from `undefined` to instantiated when first accessed
     * via {@link Actions.get}, implementing the lazy evaluation
     * pattern.
     */
    protected readonly _actionsMap: Map<string, Action | undefined>;
    /**
     * Set of all action names for quick lookup.
     *
     * @remarks
     * This set provides O(1) existence checks for action names, enabling
     * efficient validation during template expansion and duplicate detection.
     *
     * Key characteristics:
     *
     * <ol>
     * <li>Known only after <code>Actions.initialise()</code>
     *    completes.</li>
     * <li>Contains all action names including those generated from
     *    templates.</li>
     * <li>Used to detect duplicate action names that might arise from template
     *    expansion conflicts or explicit duplicates in
     *    <code>package.json</code>.</li>
     * </ol>
     *
     * This redundant storage (alongside `_actionsMap`) is justified by the
     * performance benefit for name existence checks, especially in packages
     * with many actions.
     */
    protected readonly _namesSet: Set<string>;
    /**
     * Map of expanded action names to their original JSON action names.
     *
     * @remarks
     * This reverse mapping enables retrieving the original action definition
     * from `jsonActions` when lazy-loading action instances.
     *
     * Mapping behavior:
     *
     * <ol>
     * <li><b>For regular actions:</b> Maps action name to itself (identity
     *    mapping).</li>
     * <li><b>For template actions:</b> Maps each generated action name back to
     *    the original template name (e.g.,
     *    <code>test-x64</code> → <code>test-\{\{ matrix.arch \}\}</code>).</li>
     * <li>Enables <code>Actions.get()</code> to locate the correct JSON
     *    definition when instantiating an action on demand.</li>
     * </ol>
     *
     * This indirection is essential for the lazy evaluation pattern, allowing
     * deferred instantiation while maintaining the connection to original
     * definitions.
     */
    protected readonly _jsonActionsNamesMap: Map<string, string>;
    /**
     * Flag indicating whether the actions collection has been initialised.
     *
     * @remarks
     * This flag prevents redundant initialisation and ensures idempotent
     * behavior when {@link Actions.initialise} is called multiple
     * times.
     *
     * State transitions:
     *
     * <ol>
     * <li>Initially <code>false</code> after construction.</li>
     * <li>Set to <code>true</code> after successful template expansion and
     *   action name
     *   registration.</li>
     * <li>Checked at the beginning of <code>Actions.initialise()</code> to
     *   return early if already initialised.</li>
     * </ol>
     *
     * This pattern supports safe repeated calls during complex initialisation
     * sequences without duplicating work or corrupting internal state.
     */
    protected _isInitialised: boolean;
    /**
     * Cached array of all action names in the collection.
     *
     * @remarks
     * This array provides O(1) access to action names without repeatedly
     * creating new arrays from the map keys, improving performance when the
     * names are accessed multiple times.
     *
     * Key characteristics:
     *
     * <ol>
     * <li>Empty initially after construction.</li>
     * <li>Populated during <code>Actions.initialise()</code> after all
     *    action names
     *    are determined.</li>
     * <li>Contains all action names including those generated from
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
     * Constructs an actions collection instance.
     *
     * @remarks
     * The constructor performs partial initialisation. Complete initialisation
     * requires calling the `Actions.initialise()` method.
     *
     * @param log - The logger instance for output and diagnostics.
     */
    constructor({ engine, substitutionsVariables, jsonActions, inheritedActionsMap, buildConfiguration, log, }: ActionsConstructorParameters);
    /**
     * Completes the async initialisation of the actions collection.
     *
     * @remarks
     * This method implements the first step of lazy evaluation. It processes
     * all action definitions by expanding template action names based on matrix
     * parameters, but does not evaluate the action content or perform Liquid
     * substitutions. The actual template evaluation and variable substitution
     * occur later when individual actions are initialised via
     * {@link Action.initialise}, and only for actions that are
     * actually used. This approach avoids unnecessary operations on unused
     * actions. The method also validates that all expanded action names are
     * unique.
     *
     * @returns A promise that resolves to `true` if initialisation was
     * performed, or `false` if already initialised.
     *
     * @throws {@link ConfigurationError}
     * If duplicate action names are detected or if template expansion fails.
     */
    initialise(): Promise<boolean>;
    /**
     * The number of actions in the collection.
     *
     * @remarks
     * This value is known only after `initialise()`.
     *
     * This getter provides direct access to the collection size, enabling
     * callers to check for emptiness or iterate with knowledge of the
     * collection's extent.
     *
     * @returns The number of actions in the collection.
     */
    get size(): number;
    /**
     * Indicates whether the actions collection is empty.
     *
     * @remarks
     * This value is known only after `initialise()`.
     *
     * @returns `true` if there are no actions, `false` otherwise.
     */
    get isEmpty(): boolean;
    /**
     * The names of all actions in the collection.
     *
     * @remarks
     * This value is known only after `initialise()`.
     *
     * This getter returns the cached array of action names for efficient
     * repeated access without recreating the array.
     *
     * @returns An array of action names.
     */
    get names(): string[];
    /**
     * Checks whether an action with the specified name exists.
     *
     * @remarks
     * This value is known only after `initialise()`.
     *
     * @param actionName - The name of the action to check.
     * @returns `true` if the action exists, `false` otherwise.
     */
    has(actionName: string): boolean;
    /**
     * Retrieves an action by name, creating it if not yet instantiated.
     *
     * @remarks
     * This method implements lazy evaluation to avoid unnecessary operations.
     * Actions are instantiated on demand but remain uninitialised until actually
     * used. The two-step process works as follows:
     *
     * <ol>
     * <li>During collection initialisation
     *   (<code>Actions.initialise()</code>),
     *   only the matrix of options is evaluated for each template, expanding
     *   only the action names without processing their content.</li>
     * <li>Later, when an action is accessed via this method and subsequently
     *   initialised (<code>Action.initialise()</code>), the template is
     *   fully evaluated and Liquid substitutions are performed on the
     *   commands.</li>
     * </ol>
     *
     * This approach ensures that only actions that are actually used incur the
     * cost of template evaluation and variable substitution.
     *
     * @param actionName - The name of the action to retrieve.
     * @returns The action instance.
     *
     * @throws {@link ConfigurationError}
     * If an action with that name does not exist.
     */
    get(actionName: string): Action;
    /**
     * Processes a template action by expanding it and registering the generated
     * actions.
     *
     * @remarks
     * This helper method is called during collection initialisation for each
     * action whose name contains template syntax (<code>\{\{</code> markers).
     *
     * Processing steps:
     *
     * <ol>
     * <li>Calls <code>_expandTemplateActions()</code> to generate all action
     *    instances from the template's matrix parameters.</li>
     * <li>Validates that each expanded action name is unique and does not
     *    conflict with existing actions.</li>
     * <li>Registers each expanded action in the internal maps:
     *   <ul>
     *   <li><code>_actionsMap</code>: Maps name to action instance.</li>
     *   <li><code>_jsonActionsNamesMap</code>: Maps expanded name back to
     *      original template name.</li>
     *   <li><code>_namesSet</code>: Tracks all registered names for
     *      duplicate detection.</li>
     *   </ul>
     * </li>
     * </ol>
     *
     * @param actionName - The template action name containing Liquid variables.
     * @param jsonActionTemplate - The JSON template definition containing matrix
     * parameters and an action template.
     * @returns A promise that resolves when processing is complete.
     *
     * @throws {@link ConfigurationError}
     * If duplicate action names are detected during expansion or if template
     * expansion fails.
     */
    protected _processTemplate({ actionName, jsonActionTemplate, }: {
        actionName: string;
        jsonActionTemplate: JsonActionTemplate;
    }): Promise<void>;
    /**
     * Expands a template action into multiple concrete actions.
     *
     * @remarks
     * This method uses the {@link TemplateExpander} to compute the Cartesian
     * product of all matrix parameter values and creates a separate action for
     * each combination, substituting matrix values into both the action name
     * and command templates.
     *
     * Processing steps:
     *
     * <ol>
     * <li>Validates matrix and template structure.</li>
     * <li>Delegates to <code>TemplateExpander</code> for matrix processing and
     *    name expansion.</li>
     * <li>Creates action instances via factory callback for each
     *    combination.</li>
     * </ol>
     *
     * Matrix variables are scoped to individual actions and accessible via
     * the `matrix` namespace during action command evaluation.
     *
     * @param actionName - The template action name containing Liquid variables.
     * @param jsonActionTemplate - The JSON action template definition containing
     * matrix parameters and a template.
     * @returns A promise that resolves to a map of expanded action names to
     * their corresponding action instances.
     *
     * @throws {@link ConfigurationError}
     * If the matrix structure is invalid, template format is incorrect, or
     * substitution fails.
     */
    protected _expandTemplateActions({ actionName, jsonActionTemplate, }: {
        actionName: string;
        jsonActionTemplate: JsonActionTemplate;
    }): Promise<Map<string, Action>>;
}
/**
 * Configuration parameters for constructing an action instance.
 *
 * @remarks
 * This interface defines the required configuration for creating an
 * instance of {@link Action}. Most properties are mandatory except for
 * the optional <code>matrixParameters</code>, which is only needed for
 * template-generated actions that were created from matrix expansion.
 *
 * The parameters provide the action with its identity (name), command
 * definitions, access to the parent collection for shared resources, and
 * optional matrix parameter values for template-generated actions.
 */
export interface ActionConstructorParameters {
    /**
     * The name of the action.
     */
    actionName: string;
    /**
     * The JSON definition of the action commands.
     */
    jsonAction: JsonActionContent;
    /**
     * The parent actions collection this action belongs to.
     */
    parentActions: Actions;
    /**
     * Optional matrix parameter values for template-generated actions.
     */
    matrixParameters?: LiquidSubstitutionsStrings;
}
/**
 * An individual <b>xpm</b> action containing commands to be executed.
 *
 * @remarks
 * Actions are lazily initialised, with variable substitution performed
 * only when the action is first retrieved and initialised. This allows for
 * efficient handling of large numbers of actions generated
 * from templates.
 *
 * An action can exist in three states:
 *
 * <ol>
 * <li><b>Undefined:</b> Name is known but instance not yet created.</li>
 * <li><b>Instantiated:</b> Object exists but commands not yet evaluated.</li>
 * <li><b>Initialised:</b> Commands fully evaluated with Liquid
 *    substitutions.</li>
 * </ol>
 *
 * This design minimizes memory usage and computation for actions that are
 * defined but never executed, which is common when using matrix templates
 * to generate platform-specific or configuration-specific actions.
 */
export declare class Action {
    /**
     * The name of the action.
     *
     * @remarks
     * This is the final, expanded action name used for identification and
     * execution. For template-generated actions, this is the concrete name
     * after matrix substitution (e.g., `test-x64` rather than
     * `test-{{ matrix.arch }}`).
     *
     * The name is used for:
     *
     * <ol>
     * <li>User-facing identification when listing or executing actions.</li>
     * <li>Logging and diagnostic output to track action lifecycle.</li>
     * <li>Creating copies of inherited actions with preserved names.</li>
     * </ol>
     *
     * Names must be unique within the actions collection, enforced during
     * {@link Actions.initialise}.
     */
    readonly name: string;
    /**
     * The JSON definition of the action commands.
     *
     * @remarks
     * This holds the raw command definition as it appears in `package.json`,
     * before variable substitution. The format can be:
     *
     * <ol>
     * <li><b>Simple string:</b> Single command line.</li>
     * <li><b>String array:</b> Multiple commands for sequential execution.</li>
     * </ol>
     *
     * The definition is preserved in its original form to enable:
     *
     * <ol>
     * <li>Creating copies of inherited actions with identical definitions.</li>
     * <li>Deferred template evaluation during
     * <code>Action.initialise()</code>.</li>
     * <li>Re-evaluation if needed with different variable contexts.</li>
     * </ol>
     *
     * This immutable storage ensures actions can be safely copied and
     * initialised multiple times without side effects.
     */
    readonly jsonAction: JsonActionContent;
    /**
     * The parent actions collection this action belongs to.
     *
     * @remarks
     * This reference maintains the hierarchical relationship between individual
     * actions and their containing collection, providing essential context for
     * action initialisation and execution.
     *
     * The parent collection provides access to:
     *
     * <ol>
     * <li>Liquid templating engine for variable substitution.</li>
     * <li>Substitution variables hierarchy (package metadata, configuration,
     *   environment, platform detection).</li>
     * <li>Logger instance for diagnostic output.</li>
     * <li>Build configuration context when actions belong to a specific
     *   configuration rather than the package root.</li>
     * </ol>
     *
     * This design enables actions to access shared resources without duplicating
     * them, while maintaining proper scoping for template evaluation. During
     * initialisation, the action combines parent-level substitution variables
     * with its own matrix parameters to create a complete context for Liquid
     * template processing.
     */
    readonly parentActions: Actions;
    /**
     * The matrix parameter values for template-generated actions.
     *
     * @remarks
     * For template-generated actions, this object contains the specific matrix
     * parameter values that produced this action instance from the template.
     *
     * Usage pattern:
     *
     * <ol>
     * <li>Undefined for regular (non-template) actions.</li>
     * <li>For template actions, contains key-value pairs from the matrix
     *   combination (e.g.,
     *   <code>\{ arch: 'x64', platform: 'linux' \}</code>).</li>
     * <li>Merged into substitution variables during
     *   <code>Action.initialise()</code>, making values accessible via the
     *   <code>matrix</code> namespace in command templates.</li>
     * <li>Enables the same command template to generate different concrete
     *   commands for each matrix combination.</li>
     * </ol>
     *
     * Example: A template with `{{ matrix.arch }}` becomes `x64` when this
     * action's matrix parameters include `{ arch: 'x64' }`.
     */
    protected readonly _matrixParameters?: LiquidSubstitutionsStrings;
    /**
     * The array of command strings after variable substitution.
     *
     * @remarks
     * This array contains the fully evaluated command lines ready for
     * execution, with all Liquid template variables substituted.
     *
     * Lifecycle states:
     *
     * <ol>
     * <li>Undefined initially and until <code>Action.initialise()</code>
     *   is called.</li>
     * <li>Populated during initialisation by evaluating
     *   <code>jsonAction</code> with the
     *   Liquid engine and complete variable context.</li>
     * <li>Array-based JSON definitions are joined, substituted, then split back
     *   into individual command lines.</li>
     * <li>Each string represents one command line to be executed
     *   sequentially.</li>
     * </ol>
     *
     * Attempting to access via the `commands` getter before initialisation
     * will trigger an assertion error, enforcing correct usage order.
     */
    protected _commands?: string[];
    /**
     * Flag indicating whether the action has been initialised.
     *
     * @remarks
     * This flag ensures idempotent initialization and prevents redundant
     * template evaluation when {@link Action.initialise} is called
     * multiple times.
     *
     * State transitions:
     *
     * <ol>
     * <li>Initially <code>false</code> after construction.</li>
     * <li>Set to <code>true</code> after successful command substitution and
     *   evaluation.</li>
     * <li>Checked at the start of <code>Action.initialise()</code> to
     *   return early if already initialised.</li>
     * </ol>
     *
     * This pattern allows safe repeated calls during complex initialization
     * sequences or when actions are accessed multiple times, avoiding the
     * computational cost of re-evaluating templates unnecessarily.
     */
    protected _isInitialised: boolean;
    /**
     * Constructs an action instance.
     *
     * @remarks
     * The constructor performs partial initialisation. Variable substitution
     * requires calling the {@link Action.initialise} method.
     *
     * @param actionName - The name of the action.
     * @param jsonAction - The JSON definition of the action commands.
     * @param parentActions - The parent actions collection this action belongs
     * to.
     * @param matrixParameters - Optional matrix parameter values for
     * template-generated actions.
     */
    constructor({ actionName, jsonAction, parentActions, matrixParameters, }: ActionConstructorParameters);
    /**
     * Completes the async initialisation of the action.
     *
     * @remarks
     * This method performs variable substitution on the action commands using
     * the Liquid templating engine and the available substitution variables,
     * including any matrix parameters for template-generated actions.
     *
     * The substitution context includes:
     *
     * <ol>
     * <li>All package-level substitution variables (configuration, package
     *   metadata, platform detection, etc.).</li>
     * <li>Build configuration variables if this action belongs to a
     *   configuration.</li>
     * <li>Matrix parameters for template-generated actions, accessible via
     *   the <code>matrix</code> namespace (e.g.,
     *   <code>\{\{ matrix.arch \}\}</code>).</li>
     * </ol>
     *
     * Array-based command definitions are joined with newlines before
     * substitution, then split back into individual commands after processing.
     * This allows commands to span multiple array elements while maintaining
     * clean formatting in the package manifest.
     *
     * @returns A promise that resolves to `true` if initialisation was
     * performed, or `false` if already initialised.
     *
     * @throws {@link ConfigurationError}
     * If command substitution fails.
     */
    initialise(): Promise<boolean>;
    /**
     * Retrieves the array of command strings for this action.
     *
     * @remarks
     * The action must be initialised via {@link Action.initialise}
     * before accessing this property. Attempting to access commands from an
     * uninitialised action will result in an assertion error.
     *
     * @returns The array of command strings after variable substitution.
     */
    get commands(): string[];
}
//# sourceMappingURL=actions.d.ts.map