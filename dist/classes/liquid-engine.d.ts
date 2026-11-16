import * as liquidjs from 'liquidjs';
import { PlatformDetector } from './platform-detector.js';
/**
 * Liquid engine configured for <b>xpm</b> templates.
 *
 * @remarks
 * This class extends the Liquid engine and registers custom filters
 * for path manipulation, string formatting, and convenience helpers used across
 * <b>xpm</b> templates.
 *
 * The engine is configured with strict parsing options to catch template
 * errors early during development. Custom filters are organized into
 * categories:
 *
 * <ol>
 * <li><b>Path manipulation:</b> Platform-specific and cross-platform path
 *    operations
 *    (<code>basename</code>, <code>dirname</code>, <code>join</code>,
 *    <code>relative</code>, <code>normalize</code>) for default, POSIX, and
 *    Win32 paths.</li>
 * <li><b>String formatting:</b> Utilities for printf-style formatting and
 *    filename
 *    sanitization.</li>
 * <li><b>Array/string conversion:</b> Filters for joining and splitting
 *    lines.</li>
 * <li><b>Object introspection:</b> Filters for extracting object keys.</li>
 * </ol>
 *
 * These filters enable templates to perform complex path manipulations and
 * string transformations without requiring external dependencies or custom
 * template tags.
 */
export declare class LiquidEngine extends liquidjs.Liquid {
    /**
     * The platform detector instance for platform-specific behaviour.
     */
    private readonly platformDetector;
    /**
     * Constructs a Liquid engine instance with xpm-specific settings and
     * filters.
     *
     * @remarks
     * The constructor configures strict parsing options and registers
     * filters for path handling, formatting, and list operations.
     *
     * Configuration options:
     *
     * <ul>
     * <li><b>strictFilters:</b> Throw errors for undefined filters rather than
     *    silently ignoring them.</li>
     * <li><b>strictVariables:</b> Throw errors for undefined variables rather
     *    than
     *   rendering empty strings.</li>
     * <li><b>trimTagLeft/Right:</b> Preserve whitespace around template
     *    tags.</li>
     * <li><b>trimOutputLeft/Right:</b> Preserve whitespace around output
     * expressions.</li>
     * <li><b>greedy:</b> Use non-greedy matching for better template
     *    compatibility.</li>
     * <li><b>lenientIf:</b> Allow flexible truthiness in conditional
     *    expressions.</li>
     * </ul>
     *
     * Filter registration:
     *
     * <ul>
     * <li><b>Platform-aware path filters (default, posix, win32):</b> delegate to
     *    Node.js path module for consistent cross-platform behavior.</li>
     * <li><b>Custom filters (to_filename, join_lines, split_lines, keys):</b>
     *    provide
     *    template-specific functionality not available in standard Liquid.</li>
     * <li>All filters are registered during construction for immediate
     *    availability in templates.</li>
     * </ul>
     *
     * @param platformDetector - The platform detector instance for
     * platform-specific behaviour. Defaults to a new {@link PlatformDetector}
     * instance.
     */
    constructor({ platformDetector, options, }?: {
        platformDetector?: PlatformDetector;
        options?: liquidjs.LiquidOptions;
    });
}
//# sourceMappingURL=liquid-engine.d.ts.map