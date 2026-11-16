import { Logger } from '@xpack/logger';
/**
 * Represents a list of action command strings.
 *
 * @remarks
 * Action commands are always stored as an array of strings after Liquid
 * template evaluation, even if the original definition in `package.json` was
 * a single string.
 *
 * Each string represents a complete command to be executed in sequence.
 * Commands are typically shell commands but can be any executable that can
 * be invoked from the command line.
 *
 * The array structure enables:
 *
 * <ul>
 * <li><b>Multi-step actions:</b> Execute multiple commands in order.</li>
 * <li><b>Error handling:</b> Stop execution on first command failure (default
 *   behavior).</li>
 * <li><b>Logging:</b> Report progress as each command completes.</li>
 * </ul>
 *
 * Commands have access to the full shell environment and can reference
 * environment variables, pipe outputs, or chain operations using standard
 * shell syntax (`&&`, `||`, `|`, etc.).
 */
export type ActionCommands = string[];
/**
 * Defines the <b>xpm</b> configuration options.
 *
 * @remarks
 * Configuration options control <b>xpm</b> operation behavior,
 * providing flags for
 * safe mode overrides, installation optimizations, testing scenarios, and
 * property overrides.
 *
 * Configuration lifecycle:
 *
 * <ol>
 * <li>Created from CLI arguments or programmatic API calls.</li>
 * <li>Merged with defaults to form complete configuration.</li>
 * <li>Passed through <code>Context</code> to all <b>xpm</b> operations.</li>
 * <li>Consulted by operations to determine behavior (skip, force,
 * dry-run).</li>
 * </ol>
 *
 * Key configuration patterns:
 *
 * <ul>
 * <li><b>Force mode (<code>doForce: true</code>):</b> Bypasses safety checks
 *   like "already
 *   installed" or "files exist". Use with caution as it can overwrite
 *   data.</li>
 * <li><b>Dry run (<code>isDryRun: true</code>):</b> Simulates operations
 *   without making changes,
 *   useful for testing or previewing actions.</li>
 * </ul>
 *
 * The extensible design (additional properties allowed) supports future
 * configuration options without breaking changes.
 */
export interface Config {
    /**
     * Whether to force operations even when safeguards would prevent them.
     */
    doForce?: boolean;
    /**
     * Whether to skip operations if the target is already installed.
     */
    doSkipIfInstalled?: boolean;
    /**
     * Whether to perform a dry run without making changes.
     */
    isDryRun?: boolean;
    /**
     * The properties map used for substitutions.
     */
    properties?: Record<string, string | boolean | number>;
    /**
     * The current working directory for operations that require a base path.
     */
    cwd: string;
    /**
     * Allows additional configuration properties.
     */
    [key: string]: unknown;
}
/**
 * Provides the execution context for <b>xpm</b> operations.
 *
 * @remarks
 * The context object serves as the central coordination point for all
 * <b>xpm</b>
 * operations, providing access to logging, configuration, and extensible
 * state.
 *
 * Context flow:
 *
 * <ol>
 * <li>Created at the start of each <b>xpm</b> command execution.</li>
 * <li>Initialized with logger instance and configuration options.</li>
 * <li>Passed to all library functions and classes that perform <b>xpm</b>
 *    operations.</li>
 * <li>Extended with additional properties as needed by specific operations
 *    (e.g., package paths, temporary directories, cache state).</li>
 * </ol>
 *
 * Core responsibilities:
 *
 * <ul>
 * <li><b>Logging:</b> Provides consistent output and diagnostics
 *    through the logger
 *    instance, enabling verbosity control and structured output.</li>
 * <li><b>Configuration:</b> Makes operational flags and user preferences
 *    accessible to all components.</li>
 * <li><b>State sharing:</b> The extensible design allows operations to attach
 *   computed values or state that should be available to subsequent
 *   operations within the same execution.</li>
 * </ul>
 *
 * The context pattern enables dependency injection, making the code more
 * testable and allowing operations to access shared resources without
 * global state.
 */
export interface Context {
    /**
     * The logger instance for output and diagnostics.
     */
    log: Logger;
    /**
     * The <b>xpm</b> configuration options.
     */
    config: Config;
    /**
     * The absolute path to the module folder.
     */
    rootPath: string;
    /**
     * Allows additional context properties.
     */
    [key: string]: any;
}
//# sourceMappingURL=xpm.d.ts.map