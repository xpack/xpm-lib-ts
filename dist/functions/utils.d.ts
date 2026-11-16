import { PlatformDetector } from '../classes/platform-detector.js';
/**
 * Extracts an error message string from an unknown error value.
 *
 * @remarks
 * This utility handles error values of any type, extracting the message
 * property from `Error` instances or converting other types to strings.
 * Useful for consistent error reporting when the error type is unknown.
 *
 * TypeScript's catch clause types errors as `unknown` for safety, since
 * JavaScript allows throwing any value (not just `Error` instances). This
 * function provides a type-safe way to extract a message string:
 *
 * <ul>
 * <li><b>For Error instances:</b> Returns the <code>message</code>
 *    property.</li>
 * <li><b>For other types:</b> Converts to string using <code>String()</code>,
 *    which handles
 *    primitives, objects with <code>toString()</code>, <code>null</code>,
 *    and <code>undefined</code> gracefully.</li>
 * </ul>
 *
 * Common usage pattern:
 * ```typescript
 * try {
 *   // code that might throw
 * } catch (error) {
 *   const message = getErrorMessage(error);
 *   log.error(message);
 * }
 * ```
 *
 * @param error - The error value to convert.
 * @returns The error message string.
 */
export declare function getErrorMessage(error: unknown): string;
/**
 * Builds a unique key using the current platform and architecture.
 *
 * @remarks
 * Generates a platform identifier string used for matching binary packages
 * to the current system or for platform-specific configuration.
 *
 * Platform key format: `<platform>-<arch>`
 *
 * Examples:
 *
 * <ul>
 * <li><code>darwin-x64</code> (macOS on Intel)</li>
 * <li><code>darwin-arm64</code> (macOS on Apple Silicon)</li>
 * <li><code>linux-x64</code> (Linux on 64-bit Intel/AMD)</li>
 * <li><code>win32-x64</code> (Windows on 64-bit)</li>
 * </ul>
 *
 * Architecture coercion rules (when doForce32bit is true):
 *
 * <ul>
 * <li><b>x64 → ia32:</b> Coerces 64-bit Intel/AMD architecture to 32-bit
 *    on all platforms.</li>
 * <li><b>arm64 → arm:</b> Coerces 64-bit ARM architecture to 32-bit
 *    on all platforms.</li>
 * </ul>
 *
 * This coercion is useful for backward compatibility scenarios where only
 * 32-bit binaries are available but can run on 64-bit systems. The
 * platform key matches the naming conventions used in binary xPack
 * distributions.
 *
 * @param doForce32bit - Whether to coerce 64-bit architectures to
 * their 32-bit equivalents.
 * @param platformDetector - The platform detector instance to use. Defaults
 * to a new {@link PlatformDetector} instance.
 * @returns The platform key in the form `platform-arch`.
 */
export declare function getPlatformKey({ doForce32bit, platformDetector, }?: {
    doForce32bit?: boolean;
    platformDetector?: PlatformDetector;
}): string;
/**
 * Checks whether a string contains Liquid template syntax.
 *
 * @remarks
 * This utility function detects the presence of Liquid template markers
 * in a string, indicating that the string requires template processing.
 *
 * Liquid syntax patterns detected:
 *
 * <ol>
 * <li><b>Variable output:</b> <code>\{\{</code> marks the start of a variable
 *    interpolation (e.g., <code>\{\{ package.name \}\}</code>).</li>
 * <li><b>Control flow:</b> <code>\{%</code> marks the start of a tag
 *    for logic or iteration (e.g., <code>\{% if condition %\}</code>,
 *    <code>\{% for item in array %\}</code>).</li>
 * </ol>
 *
 * The function uses a regular expression to efficiently scan the string
 * for these markers without needing to check for both patterns separately.
 * This is more efficient than calling <code>includes()</code> twice and
 * provides a single point of maintenance for Liquid syntax detection logic.
 *
 * Common usage:
 *
 * <ul>
 * <li>Determine whether to process a value through the Liquid engine.</li>
 * <li>Skip unnecessary template evaluation for static strings.</li>
 * <li>Validate configuration values for template content.</li>
 * </ul>
 *
 * @param value - The string to check for Liquid syntax.
 * @returns <code>true</code> if the string contains Liquid syntax markers,
 * <code>false</code> otherwise.
 */
export declare function hasLiquidSyntax(value: string): boolean;
//# sourceMappingURL=utils.d.ts.map