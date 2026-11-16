import { Logger } from '@xpack/logger';
/**
 * Configuration parameters for constructing a policies instance.
 *
 * @remarks
 * This interface defines the required configuration for creating an
 * instance of {@link Policies}. Both properties are mandatory.
 *
 * The parameters provide the minimum <b>xpm</b> version for policy
 * evaluation and the logger for diagnostic output.
 */
export interface PoliciesConstructorParameters {
    /**
     * The minimum <b>xpm</b> version to evaluate.
     */
    minVersion?: string;
    /**
     * The logger instance for output and diagnostics.
     */
    log: Logger;
}
/**
 * Computes feature policy flags based on a minimum <b>xpm</b> version.
 *
 * @remarks
 * This class derives compatibility flags from a specified minimum
 * version to preserve legacy behaviour when required.
 *
 * Policy versioning allows <b>xpm</b> to evolve its behavior while maintaining
 * backward compatibility for packages that specify older minimum versions.
 * Each policy flag represents a breaking change introduced at a specific
 * <b>xpm</b> version:
 *
 * <ul>
 * <li>Packages with minimumXpmRequired \< version threshold get
 * legacy behavior.</li>
 * <li>Packages with minimumXpmRequired \>= version threshold get
 * new behavior.</li>
 * </ul>
 *
 * This approach ensures that:
 *
 * <ol>
 * <li>Existing packages continue to work with newer <b>xpm</b> versions without
 *    modification.</li>
 * <li>New packages can opt into modern behavior by specifying a recent
 *    minimumXpmRequired.</li>
 * <li>Breaking changes are tied to explicit version declarations rather than
 *    <b>xpm</b> installation version.</li>
 * </ol>
 *
 * Policy flags are evaluated once during initialization and cached for the
 * duration of the operation.
 */
export declare class Policies {
    /**
     * The minimum <b>xpm</b> version used to derive policy flags.
     */
    minVersion: string;
    /**
     * Indicates whether npm dependencies are shared across installations.
     *
     * @remarks
     * Legacy behavior (before 0.14.0): npm dependencies were shared in a global
     * location, similar to how npm itself works with global `node_modules`.
     *
     * Modern behavior (0.14.0+): npm dependencies are installed locally per
     * <b>xpm</b> package, providing better isolation and avoiding version
     * conflicts.
     *
     * Set to `true` for packages with minimumXpmRequired \< 0.14.0.
     */
    shareNpmDependencies: boolean;
    /**
     * Indicates whether local `xpacks` folders are non-hierarchical.
     *
     * @remarks
     * Legacy behavior (before 0.16.0): xpacks were stored in a flat structure
     * within the local `xpacks` folder.
     *
     * Modern behavior (0.16.0+): xpacks are organized hierarchically within
     * the `xpacks` folder, mirroring the scoped package structure (e.g.,
     * `xpacks/@scope/package`).
     *
     * Set to `true` for packages with minimumXpmRequired \< 0.16.0.
     */
    nonHierarchicalLocalXpacksFolder: boolean;
    /**
     * Indicates whether dependencies are restricted to string-only notation.
     *
     * @remarks
     * Legacy behavior (before 0.16.0): dependencies could only be specified as
     * strings (e.g., `"@scope/package": "1.0.0"`).
     *
     * Modern behavior (0.16.0+): dependencies can be specified as objects with
     * additional metadata (e.g., platforms, repositories), providing richer
     * dependency configuration.
     *
     * Set to `true` for packages with minimumXpmRequired \< 0.16.0.
     */
    onlyStringDependencies: boolean;
    /**
     * Indicates whether `xpm init` templates accept a single parameter.
     *
     * @remarks
     * Legacy behavior (before 0.22.0): init templates accepted only a single
     * parameter combining template name and optional arguments.
     *
     * Modern behavior (0.22.0+): init templates support multiple parameters
     * for more flexible template initialization and configuration.
     *
     * Set to `true` for packages with minimumXpmRequired \< 0.22.0.
     */
    singleParameterXpmInitTemplate: boolean;
    /**
     * Indicates whether `xpm init` templates expose top-level properties.
     *
     * @remarks
     * Legacy behavior (before 0.23.0): init templates exposed the configuration
     * properties both as top-level and also grouped as `properties`
     * in the liquid substitutions variables.
     *
     * Modern behavior (0.23.0+): init templates expose the configuration
     * properties as `matrix` vs. the liquid substitutions variables as
     * `properties` providing a clearer structure and avoiding conflicts.
     *
     * Set to `true` for packages with minimumXpmRequired \< 0.23.0.
     */
    topPropertiesXpmInitTemplate: boolean;
    /**
     * Constructs policy flags based on a minimum <b>xpm</b> version.
     *
     * @remarks
     * The constructor evaluates each policy flag by comparing the provided
     * minimum version against threshold versions where behavior changed.
     *
     * Evaluation process:
     *
     * <ol>
     * <li>Validate that <code>minVersion</code> is a valid semver string.</li>
     * <li>If invalid, retain default values (all flags false = modern
     * behavior).</li>
     * <li>For each policy, use <code>semver.lt()</code> to check if
     *    <code>minVersion</code> is less than
     *    the threshold version.</li>
     * <li>If <code>minVersion</code> \< threshold, enable legacy behavior
     *    (flag = <code>true</code>).</li>
     * <li>If <code>minVersion</code> \>= threshold, use modern behavior
     *    (flag = <code>false</code>).</li>
     * </ol>
     *
     * This ensures that packages explicitly declaring their minimum version
     * get the behavior that was current at that version, while packages
     * without a valid minimum version default to the most modern behavior.
     *
     * @param minVersion - The minimum <b>xpm</b> version to evaluate.
     * @param log - The logger instance for output and diagnostics.
     */
    constructor({ minVersion, log }: PoliciesConstructorParameters);
}
//# sourceMappingURL=policies.d.ts.map