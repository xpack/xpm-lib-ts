/**
 * Represents a map of `xpm init` template property definitions.
 *
 * @remarks
 * Template properties define the interactive configuration interface for
 * `xpm init` command, allowing templates to collect user input before
 * generating project files.
 *
 * Each property key becomes accessible in template files via Liquid syntax
 * as `{{ properties.key }}`. Property definitions control the prompt type,
 * validation, default values, and available options.
 *
 * Example usage in template metadata:
 *
 * ```js
 * {
 *   language: {
 *     label: 'Programming language',
 *     description: 'Select the preferred programming language',
 *     type: 'select',
 *     items: {
 *       c: 'C for the application files',
 *       cpp: 'C++ for the application files'
 *     },
 *     default: 'cpp',
 *     isMandatory: true
 *   }
 * }
 * ```
 */
export type InitTemplatePropertiesDefinitions = Record<string, InitTemplatePropertiesDefinition>;
/**
 * Defines an `xpm init` single template property.
 *
 * @remarks
 * Property definitions control how users are prompted for template
 * configuration values during `xpm init` execution.
 *
 * Property types:
 *
 * <ul>
 * <li><code>select</code>: Present a list of options for the user to
 *    choose from.
 *    Requires <code>items</code> to be populated with available choices.</li>
 * <li><code>string</code>: Accept free-form text input from the user.</li>
 * <li><code>number</code>: Accept numeric input with validation.</li>
 * <li><code>boolean</code>: Accept yes/no input
 *    (<code>true</code>/<code>false</code>).</li>
 * </ul>
 *
 * Platform filtering: For `select` types, items can specify platform
 * constraints via `InitTemplateItemValue`, hiding options that
 * don't match the current platform. This enables platform-specific
 * configuration without manual filtering.
 *
 * Mandatory properties without defaults will block template initialization
 * until the user provides a value. Optional properties with defaults use
 * the default when the user skips the prompt.
 */
export interface InitTemplatePropertiesDefinition {
    /**
     * The human-readable label used in prompts.
     */
    label: string;
    /**
     * The description shown when the user requests help.
     */
    description: string;
    /**
     * The property value type.
     */
    type: InitTemplateType;
    /**
     * The selectable items for a `select` property.
     */
    items?: InitTemplateItems;
    /**
     * Indicates whether the property is mandatory; defaults to `false`.
     */
    isMandatory?: boolean;
    /**
     * The default value for the property. Must match the property type.
     */
    default?: string | number | boolean;
}
/**
 * Represents the supported property types for `xpm init` template
 * properties.
 *
 * @remarks
 * Property types control how the `xpm init` command prompts users for
 * configuration values during template initialisation:
 *
 * <ul>
 * <li><b><code>select</code>:</b> Presents a list of predefined options
 *    for the user to choose from. Requires the <code>items</code> field to
 *    be populated.</li>
 * <li><b><code>string</code>:</b> Accepts free-form text input from the
 *    user.</li>
 * <li><b><code>number</code>:</b> Accepts numeric input with
 *    validation.</li>
 * <li><b><code>boolean</code>:</b> Accepts yes/no input, converted to
 *    <code>true</code> or <code>false</code>.</li>
 * </ul>
 */
export type InitTemplateType = 'select' | 'string' | 'number' | 'boolean';
/**
 * Represents the available items for a `select` type property in `xpm init`
 * templates.
 *
 * @remarks
 * Items define the options users can choose from when a property uses the
 * <code>select</code> type. Each key represents the value stored when that
 * option is selected, whilst the value provides the description shown to
 * the user.
 *
 * Item values can be either:
 *
 * <ul>
 * <li><b>Simple string:</b> A description shown to all users regardless
 *    of platform.</li>
 * <li><b><code>InitTemplateItemValue</code>:</b> A platform-specific
 *    item that only appears when the current platform matches the
 *    <code>platforms</code> constraint.</li>
 * </ul>
 *
 * Example:
 * ```js
 * {
 *   gcc: 'The GCC compiler',
 *   clang: {
 *     platforms: ['darwin'],
 *     message: 'The Clang compiler (macOS only)'
 *   }
 * }
 * ```
 */
export type InitTemplateItems = Record<string, string | InitTemplateItemValue>;
/**
 * Represents the supported platform identifiers for `xpm init` template items.
 *
 * @remarks
 * Platform identifiers filter select items based on the current execution
 * environment, allowing templates to show only relevant options.
 *
 * Platform matching strategy:
 *
 * <ul>
 * <li><b>Generic platforms (linux, win32, darwin):</b> match any
 *    architecture on  operating system.</li>
 * <li><b>Specific platforms (linux-x64, darwin-arm64, etc.):</b> match
 *    only the exact  OS and architecture combination.</li>
 * </ul>
 *
 * Example: An item with `platforms: ["darwin-arm64"]` only appears when
 * running on Apple Silicon Macs, while `platforms: ["darwin"]` appears on
 * both Intel and ARM Macs.
 *
 * Common use case: Offering different toolchain options based on whether
 * the user is on Windows, macOS Intel, macOS ARM, or Linux.
 */
export type InitTemplatePlatform = 'linux' | 'linux-x64' | 'linux-arm64' | 'win32' | 'darwin' | 'darwin-x64' | 'darwin-arm64';
/**
 * Defines an `xpm init` template platform-specific item value.
 *
 * @remarks
 * Platform-specific items allow select properties to offer different
 * options based on the user's operating system and architecture. Only items
 * matching the current platform are shown to the user.
 *
 * Example usage in property definition:
 * ```js
 * {
 *   toolchain: {
 *     label: 'Toolchain',
 *     description: 'Select the toolchain to be used by the builds',
 *     type: 'select',
 *     items: {
 *       gcc: {
 *         // There is no gcc on macOS.
 *         platforms: ['linux', 'win32'],
 *         message: 'The xPack GNU Compiler Collection (GCC) toolchain'
 *       },
 *       clang: 'The xPack LLVM clang toolchain',
 *       system: {
 *         // There is no system toolchain on Windows.
 *         platforms: ['linux', 'darwin'],
 *         message: 'The system toolchain'
 *       }
 *     },
 *     default: 'clang'
 *   }
 * }
 * ```
 *
 * When running on Windows, only the "msvc" option appears. On Linux or
 * macOS Intel, only "gcc-arm" appears.
 */
export interface InitTemplateItemValue {
    /**
     * The list of supported platforms.
     */
    platforms: InitTemplatePlatform[];
    /**
     * The description message for this item.
     */
    message: string;
}
/**
 * Defines the substitution variables used by `xpm init` templates.
 *
 * @remarks
 * Substitution variables provide the context for Liquid template processing
 * during project initialization. All collected property values and
 * additional template-specific variables are accessible in template files.
 *
 * Variable structure:
 *
 * <ul>
 * <li><b><code>properties</code></b>: Contains all user-provided or
 *    default values from the
 *    template property definitions, accessible via
 *    <code>\{\{ properties.propertyName \}\}</code> in template files.</li>
 * <li><b>Additional variables:</b> Templates can define custom variables
 *    for reuse across multiple files or for computed values based on
 *    properties.</li>
 * </ul>
 *
 * Template files (with `.liquid` extension) are
 * processed with this context, allowing conditional content, loops, and
 * value substitution. Non-template files are copied as-is without
 * processing.
 *
 * Example template usage:
 * ```
 * Project name: {{ properties.name }}
 * {% if properties.language == "cpp" %}
 * Language: C++
 * {% endif %}
 * ```
 */
export interface InitTemplateSubstitutionsVariables {
    /**
     * The resolved template properties.
     */
    matrix?: Record<string, string | string[] | boolean | number>;
    /**
     * Additional template variables.
     */
    [key: string]: unknown;
}
//# sourceMappingURL=xpm-init-template.d.ts.map