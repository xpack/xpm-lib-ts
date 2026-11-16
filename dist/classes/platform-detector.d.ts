/**
 * Platform information structure for runtime environment detection.
 *
 * @remarks
 * This interface encapsulates operating system and architecture information
 * used throughout the xPack library for platform-specific behaviour,
 * path filtering, and binary distribution selection.
 */
export interface PlatformInfo {
    /**
     * The operating system platform identifier.
     *
     * @remarks
     * Common values include:
     *
     * <ul>
     * <li><code>darwin</code> (macOS)</li>
     * <li><code>linux</code> (Linux)</li>
     * <li><code>win32</code> (Windows)</li>
     * </ul>
     *
     * Corresponds to <code>process.platform</code> from Node.js.
     */
    platform: string;
    /**
     * The CPU architecture identifier.
     *
     * @remarks
     * Common values include:
     *
     * <ul>
     * <li><code>x64</code> (64-bit Intel/AMD)</li>
     * <li><code>arm64</code> (64-bit ARM)</li>
     * <li><code>ia32</code> (32-bit Intel/AMD)</li>
     * <li><code>arm</code> (32-bit ARM)</li>
     * </ul>
     *
     * Corresponds to <code>process.arch</code> from Node.js.
     */
    arch: string;
}
/**
 * Options for platform information retrieval.
 *
 * @remarks
 * This interface defines configuration options that control how platform
 * information is retrieved and processed, particularly for architecture
 * coercion scenarios.
 */
export interface PlatformInfoOptions {
    /**
     * Whether to coerce 64-bit architectures to their 32-bit equivalents.
     *
     * @remarks
     * When <code>true</code>, applies the following architecture mappings:
     *
     * <ul>
     * <li><code>x64 → ia32</code></li>
     * <li><code>arm64 → arm</code></li>
     * </ul>
     *
     * This is useful for backward compatibility scenarios where only 32-bit
     * binaries are available but can run on 64-bit systems.
     *
     * @defaultValue `false`
     */
    doForce32bit?: boolean;
}
/**
 * Platform detection service for runtime environment identification.
 *
 * @remarks
 * This class encapsulates platform and architecture detection logic,
 * providing a mockable abstraction over Node.js process properties.
 * It enables testable platform-specific behaviour without requiring
 * execution on multiple operating systems or architectures.
 *
 * Key features:
 *
 * <ol>
 * <li><b>Dependency injection:</b> Accepts a custom process object via
 *    constructor, enabling test environments to inject mock process
 *    implementations.</li>
 * <li><b>Architecture coercion:</b> Provides optional 64-bit to 32-bit
 *    architecture mapping for backward compatibility scenarios.</li>
 * <li><b>Consistent interface:</b> Returns standardised
 *    {@link PlatformInfo} objects for use throughout the xPack library.</li>
 * </ol>
 *
 * This abstraction eliminates direct <code>process.platform</code> and
 * <code>process.arch</code> access in business logic, making platform-specific
 * code paths testable via mocked platform information.
 *
 * @example
 * Default usage with actual runtime platform:
 * ```typescript
 * const detector = new PlatformDetector()
 * const info = detector.getPlatformInfo()
 * console.log(info.platform) // 'darwin', 'linux', or 'win32'
 * console.log(info.arch)     // 'x64', 'arm64', etc.
 * ```
 *
 * @example
 * Testing with mocked platform:
 * ```typescript
 * const mockProcess = {
 *   platform: 'darwin',
 *   arch: 'arm64'
 * } as NodeJS.Process
 *
 * const detector = new PlatformDetector(mockProcess)
 * const info = detector.getPlatformInfo({ doForce32bit: true })
 * // info.platform === 'darwin'
 * // info.arch === 'arm' (coerced from arm64)
 * ```
 */
export declare class PlatformDetector {
    /**
     * The Node.js process object for accessing platform information.
     */
    private readonly process;
    /**
     * Constructs a platform detector instance.
     *
     * @remarks
     * This constructor accepts an optional process object parameter, enabling
     * dependency injection for testing scenarios. When no process object is
     * provided, the global Node.js <code>process</code> is used automatically.
     *
     * The injected process object must implement the <code>platform</code> and
     * <code>arch</code> properties from the <code>NodeJS.Process</code>
     * interface.
     *
     * @param _process - The Node.js process object providing platform and
     * architecture information. Defaults to the global <code>process</code>
     * object.
     */
    constructor(_process?: NodeJS.Process);
    /**
     * Retrieves current platform and architecture information.
     *
     * @remarks
     * This method returns a {@link PlatformInfo} object containing the
     * operating system platform and CPU architecture. When the
     * <code>doForce32bit</code> option is enabled, 64-bit architectures
     * are coerced to their 32-bit equivalents.
     *
     * Architecture coercion rules (when <code>doForce32bit</code> is
     * <code>true</code>):
     *
     * <ul>
     * <li><b>x64 → ia32:</b> Coerces 64-bit Intel/AMD to 32-bit.</li>
     * <li><b>arm64 → arm:</b> Coerces 64-bit ARM to 32-bit.</li>
     * </ul>
     *
     * This coercion is useful for backward compatibility scenarios where
     * only 32-bit binaries are available but can run on 64-bit systems via
     * compatibility layers.
     *
     * The platform identifier is never modified and always reflects the actual
     * operating system (<code>darwin</code>, <code>linux</code>,
     * <code>win32</code>).
     *
     * @param options - Configuration options controlling platform information
     * retrieval.
     * @returns Platform and architecture information.
     */
    getPlatformInfo(options?: PlatformInfoOptions): PlatformInfo;
    /**
     * Checks whether the current platform is Windows.
     *
     * @remarks
     * This convenience method provides a simple boolean check for Windows
     * platform detection, commonly used for path handling and command
     * formatting decisions.
     *
     * Equivalent to checking <code>platform === 'win32'</code>.
     *
     * @returns <code>true</code> if running on Windows,
     * <code>false</code> otherwise.
     */
    isWindows(): boolean;
}
//# sourceMappingURL=platform-detector.d.ts.map