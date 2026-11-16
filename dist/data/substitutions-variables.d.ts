import * as os from 'node:os';
/**
 * Represents a map of substitution values used by Liquid templates.
 *
 * @remarks
 * Values can be strings for simple substitutions or arrays for multi-line
 * content. Array values are typically joined with newlines when rendered.
 *
 * Common use cases:
 *
 * <ul>
 * <li><b>Properties:</b> User-defined configuration values from
 *    <code>xpack.properties.</code></li>
 * <li><b>Matrix parameters:</b> Template expansion variables from
 *     <code>matrix</code> definitions.</li>
 * <li><b>Configuration data:</b> Build-specific settings and metadata.</li>
 * </ul>
 *
 * Templates access these values via namespaces like `properties.foo`,
 * `matrix.arch`, etc., with the Liquid Drop pattern providing lazy
 * evaluation and nested substitution support.
 */
export type LiquidSubstitutionsStrings = Record<string, string | string[]>;
/**
 * Defines the substitution variables available to Liquid templates.
 *
 * @remarks
 * This interface mirrors a subset of Node.js environment, operating
 * system, and path information, along with package-specific configuration
 * values.
 *
 * Variable hierarchy and scoping:
 *
 * <ol>
 * <li><b>Base variables</b> (<code>env</code>, <code>os</code>,
 *    <code>path</code>): Available globally, initialized once
 *    from Node.js runtime at startup.</li>
 * <li><b>Package variables:</b> Added when processing
 *    <code>package.json</code>, contains
 *    package metadata accessible via <code>package.name</code>,
 *    <code>package.version</code>,
 *    etc.</li>
 * <li><b>Properties:</b> User-defined values from
 *    <code>xpack.properties</code>, accessible via
 *    <code>properties.key</code>.</li>
 * <li><b>Configuration:</b> Build configuration metadata, available when
 *    processing configuration-specific templates via
 *    <code>configuration.name</code>,
 *    etc.</li>
 * <li><b>Matrix:</b> Template expansion parameters, scoped to individual
 *    expanded instances, accessible via <code>matrix.key</code>.</li>
 * </ol>
 *
 * Variables are inherited and extended through the hierarchy:
 *
 * <ul>
 * <li>package actions use package properties</li>
 * <li>configuration actions use:
 *    <ul>
 *    <li>package actions</li>
 *    <li>actions inherited from parent configurations, recursively,
 *      in order of inheritance</li>
 *    <li>configuration properties</li>
 *    </ul>
 * </li>
 * </ul>
 *
 * This ensures templates have access to appropriate
 * context without exposing unrelated data.
 */
export interface LiquidSubstitutionsVariables {
    /**
     * Process environment variables from the current execution context.
     *
     * @remarks
     * Provides access to all environment variables via `env.VARIABLE_NAME`
     * in templates. Common uses include accessing `PATH`, `HOME`, `USER`, or
     * custom variables set by build scripts.
     *
     * See {@link https://nodejs.org/dist/latest-v16.x/docs/api/process.html#process_process_env | Node.js process.env documentation}
     */
    env: NodeJS.ProcessEnv;
    /**
     * Operating system information from Node.js os module.
     *
     * @remarks
     * Provides platform detection and system information for cross-platform
     * template logic. Common uses include conditional compilation, path
     * construction, and platform-specific configuration.
     *
     * Key properties for cross-platform templates:
     *
     * <ul>
     * <li><code>os.platform</code>: Detect OS ('darwin', 'linux', 'win32').</li>
     * <li><code>os.arch</code>: Detect CPU architecture ('x64', 'arm64',
     *   etc.).</li>
     * <li><code>os.EOL</code>: Use correct line endings for generated files.</li>
     * <li><code>os.homedir</code>: Reference user's home folder portably.</li>
     * </ul>
     *
     * See {@link https://nodejs.org/dist/latest-v16.x/docs/api/os.html | Node.js os module documentation}
     */
    os: {
        /**
         * The operating system-specific end-of-line marker.
         * <ul>
         * <li><code>\\n</code> on POSIX</li>
         * <li><code>\\r\\n</code> on Windows</li>
         * </ul>
         */
        EOL: string;
        /**
         * Possible values are 'arm', 'arm64', 'ia32', 'mips', 'mipsel',
         * 'ppc', 'ppc64', 's390', 's390x', 'x32', and 'x64'.
         */
        arch: string;
        /**
         * Contains commonly used operating system-specific constants
         * for error codes, process signals, and so on. The specific
         * constants defined are described in
         * {@link https://nodejs.org/dist/latest-v16.x/docs/api/os.html#os_os_constants_1 | OS constants}
         */
        constants: {
            signals: Record<string, number>;
            errno: Record<string, number>;
        };
        /**
         * An array of objects containing information about
         * each logical CPU core.
         */
        cpus: os.CpuInfo[];
        /**
         * A string identifying the endianness of the CPU
         * for which the Node.js binary was compiled.
         *
         * Possible values are 'BE' for big endian and 'LE' for little endian.
         */
        endianness: 'BE' | 'LE';
        /**
         * The string path of the current user's home folder.
         */
        homedir: string;
        /**
         * The host name of the operating system as a string.
         */
        hostname: string;
        /**
         * A string identifying the operating system platform.
         * Possible values are 'aix', 'darwin', 'freebsd', 'linux', 'openbsd',
         * 'sunos', and 'win32'.
         */
        platform: NodeJS.Platform;
        /**
         * The operating system as a string.
         */
        release: string;
        /**
         * Returns the operating system's default folder for
         * temporary files as a string.
         */
        tmpdir: string;
        /**
         * Returns the operating system name as returned by uname(3).
         * For example, it returns 'Linux' on Linux, 'Darwin' on macOS,
         * and 'Windows_NT' on Windows.
         */
        type: string;
        /**
         * Returns a string identifying the kernel version.
         *
         * On POSIX systems, the operating system release is determined
         * by calling `uname(3)`. On Windows, `RtlGetVersion()` is used,
         * and if it is not available, `GetVersionExW()` will be used.
         */
        version: string;
    };
    /**
     * Path separators and delimiters from Node.js path module.
     *
     * @remarks
     * Provides platform-specific path constants for building file paths in
     * templates. Use these to construct paths that work correctly on all
     * platforms.
     *
     * Available constants:
     *
     * <ul>
     * <li><code>path.sep</code>: Platform-specific path separator (/ or \).</li>
     * <li><code>path.delimiter</code>: Platform-specific PATH delimiter
     *   (; or :).</li>
     * <li><code>path.posix.*</code>: Force POSIX conventions regardless
       of platform.</li>
     * <li><code>path.win32.*</code>: Force Windows conventions regardless
       of platform.</li>
     * </ul>
     *
     * Note: For path manipulation, prefer using Liquid filters like
     * `path_join`, `path_dirname`, etc., which handle cross-platform concerns
     * automatically.
     *
     * See [Node.js path module documentation](https://nodejs.org/dist/latest-v16.x/docs/api/path.html)
     */
    path: {
        /**
         * Provides the platform-specific path delimiter:
         * <ul>
         * <li><code>;</code> for Windows</li>
         * <li><code>:</code> for POSIX</li>
         * </ul>
         */
        delimiter: string;
        /**
         * Provides the platform-specific path segment separator:
         * <ul>
         * <li><code>\\</code> on Windows</li>
         * <li><code>/</code> on POSIX</li>
         * </ul>
         */
        sep: string;
        win32: {
            delimiter: string;
            sep: string;
        };
        posix: {
            delimiter: string;
            sep: string;
        };
    };
    /**
     * The package metadata exposed to Liquid templates.
     *
     * @remarks
     * Contains the entire `package.json` content, allowing templates to access
     * package name, version, description, dependencies, and xpack-specific
     * metadata.
     *
     * Common template patterns:
     *
     * <ul>
     * <li><code>\{\{ package.name \}\}</code>: Package name for generated
     *   files.</li>
     * <li><code>\{\{ package.version \}\}</code>: Version string for
     *   documentation.</li>
     * <li><code>\{\{ package.xpack.properties.key \}\}</code>: Access xpack
     *   properties.</li>
     * </ul>
     *
     * Undefined when processing templates outside of a package context.
     */
    package?: any;
    /**
     * The build configuration exposed to Liquid templates.
     *
     * @remarks
     * Available only when processing templates within a build configuration
     * context (actions, dependencies, properties belonging to a specific
     * configuration).
     *
     * Contains the configuration name and all configuration properties,
     * allowing templates to reference the current build context:
     *
     * <ul>
     * <li><code>\{\{ configuration.name \}\}</code>: The build configuration
     *   name.</li>
     * <li><code>\{\{ configuration.properties.key \}\}</code>:
     *   Configuration-specific
     *   settings.</li>
     * </ul>
     *
     * Undefined when processing package-level templates.
     */
    configuration?: {
        name: string;
        [key: string]: any;
    };
    /**
     * The properties map used for substitutions.
     *
     * @remarks
     * User-defined configuration values from `xpack.properties`
     * in `package.json`.
     * Provides a namespace for custom template variables without polluting
     * the global scope.
     *
     * Properties support nested substitutions: a property value can reference
     * other properties, package metadata, or system variables using Liquid
     * syntax. The Liquid Drop pattern ensures recursive evaluation.
     *
     * Access via `{{ properties.key }}` in templates.
     */
    properties: LiquidSubstitutionsStrings;
    /**
     * Optional matrix parameters used for template expansion.
     *
     * @remarks
     * Available only for actions or configurations generated from templates
     * with matrix definitions. Each expanded instance receives a specific
     * combination of matrix values.
     *
     * Matrix parameters enable generating multiple similar actions or
     * configurations from a single template definition. For example, a matrix
     * with `arch: ['x64', 'arm64']` and `os: ['linux', 'darwin']` generates
     * 4 instances (x64-linux, x64-darwin, arm64-linux, arm64-darwin).
     *
     * Access via `{{ matrix.key }}` in templates. Scoped to the individual
     * expanded instance, ensuring isolation between generated items.
     */
    matrix?: LiquidSubstitutionsStrings;
}
/**
 * The base substitution variables initialised from the current environment.
 *
 * @remarks
 * This constant provides the foundation for all Liquid template processing,
 * capturing the runtime environment once at module load time.
 *
 * Initialization strategy:
 *
 * <ol>
 * <li><b>Environment variables:</b> Snapshot of process.env at load time.</li>
 * <li><b>OS information:</b> OS specific definitions (platform, arch,
 *    etc.).</li>
 * <li><b>Path constants:</b> Platform-specific separators and delimiters.</li>
 * <li><b>Properties:</b> Placeholder for package-specific additions.</li>
 * </ol>
 *
 * These base variables are shared across all template processing within the
 * application and extended with package, configuration, and matrix variables
 * as needed. The base object is typically spread into new contexts rather
 * than mutated, preserving the original snapshot.
 */
export declare const liquidSubstitutionsVariablesBase: LiquidSubstitutionsVariables;
//# sourceMappingURL=substitutions-variables.d.ts.map