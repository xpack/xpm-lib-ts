import { PlatformDetector } from '../classes/platform-detector.js';
/**
 * Replaces non-alphanumeric characters with dashes to make paths
 * comply with file system names.
 *
 * @remarks
 * This function sanitizes strings to be safely used as file or folder names
 * by removing or replacing problematic characters that could cause issues
 * across different file systems.
 *
 * Platform-specific processing:
 *
 * <ul>
 * <li><b>Windows:</b> Preserves backslashes (<code>\\</code>) and colons
 *    (<code>:</code>) for drive letters
 *    and path separators (e.g., <code>C:\\path\\to\\file</code>). Replaces all
 *    other non-alphanumeric characters with dashes.</li>
 * <li><b>POSIX (Linux, macOS):</b> Preserves forward slashes (<code>/</code>)
 *    for path separators. Replaces all other non-alphanumeric characters with
 *    dashes.</li>
 * </ul>
 *
 * Post-processing: After character replacement, consecutive dashes are
 * collapsed to a single dash to avoid excessive dashes from adjacent
 * special characters (e.g., "foo--bar" becomes "foo-bar").
 *
 * Common use cases include sanitizing build configuration names,
 * user-provided identifiers, and template-generated path components.
 *
 * @param input - A path candidate.
 * @param platformDetector - The platform detector instance to use. Defaults
 * to a new {@link PlatformDetector} instance.
 * @returns A validated path.
 */
export declare function filterPath(input: string, platformDetector?: PlatformDetector): string;
/**
 * Replaces non-alphanumeric characters with dashes to make paths
 * comply with POSIX file system names.
 *
 * @remarks
 * This function provides explicit POSIX path sanitization regardless of the
 * current platform. Useful when generating paths that will be used on
 * Linux or macOS systems, or when consistency across platforms is required.
 *
 * Processing rules:
 *
 * <ul>
 * <li>Preserves forward slashes (<code>/</code>) for path separators.</li>
 * <li>Replaces all non-alphanumeric characters (except <code>/</code>) with
 *    dashes.</li>
 * <li>Collapses consecutive dashes to single dashes.</li>
 * </ul>
 *
 * Use this function instead of {@link filterPath} when you need guaranteed
 * POSIX-style sanitization even when running on Windows, such as when
 * generating paths for remote Linux systems or container images.
 *
 * @param input - A path candidate.
 * @returns A validated path.
 */
export declare function filterPosixPath(input: string): string;
/**
 * Replaces non-alphanumeric characters with dashes to make paths
 * comply with Windows file system names.
 *
 * @remarks
 * This function provides explicit Windows path sanitization regardless of
 * the current platform. Useful when generating paths that will be used on
 * Windows systems, or when consistency across platforms is required.
 *
 * Processing rules:
 *
 * <ul>
 * <li>Preserves backslashes (<code>\\</code>) for path separators.</li>
 * <li>Preserves colons (<code>:</code>) for drive letter designation (e.g.,
 *    <code>C:</code>).</li>
 * <li>Replaces all other non-alphanumeric characters with dashes.</li>
 * <li>Collapses consecutive dashes to single dashes.</li>
 * </ul>
 *
 * Use this function instead of {@link filterPath} when you need guaranteed
 * Windows-style sanitization even when running on POSIX systems, such as
 * when generating paths for remote Windows systems or WSL environments.
 *
 * @param input - A path candidate.
 * @returns A validated path.
 */
export declare function filterWin32Path(input: string): string;
//# sourceMappingURL=filter-paths.d.ts.map