import { Logger } from '@xpack/logger';
import { LiquidEngine } from '../classes/liquid-engine.js';
import { LiquidSubstitutionsVariables } from '../data/substitutions-variables.js';
/**
 * Performs substitutions on an input string using Liquid.
 *
 * @remarks
 * This function processes Liquid template syntax (variables and tags) by
 * repeatedly rendering the input until no more substitutions are detected.
 * The iterative approach supports nested substitutions where one property
 * references another.
 *
 * Processing workflow:
 *
 * <ol>
 * <li>Skip processing for empty strings to avoid unnecessary overhead.</li>
 * <li>Prepare Liquid context with substitution variables.</li>
 * <li>If <code>properties</code> exist, wrap them in
 *    <code>LiquidPropertiesDrop</code>
 *    for lazy evaluation and nested substitution support.</li>
 * <li>If <code>matrix</code> parameters exist, wrap them in
 *    <code>LiquidMatrixDrop</code>
 *    for template expansion variable access.</li>
 * <li>Iterate while Liquid syntax (<code>\{\{</code> or <code>\{%</code>)
 *   is present:
 *    <ul>
 *    <li>Parse and render the current string.</li>
 *    <li>Break if no changes occur (safety check).</li>
 *    <li>Continue with the substituted result.</li>
 *    </ul>
 * </li>
 * <li>Return the fully substituted string.</li>
 * </ol>
 *
 * The Drop pattern enables recursive property resolution: when a template
 * accesses `{{ properties.foo }}` and `foo` contains `{{ properties.bar }}`,
 * the next iteration resolves `bar`, and so on until no Liquid syntax
 * remains.
 *
 * Error handling:
 *
 * Liquid rendering errors are caught, stripped of line
 * number information (which can be misleading for nested templates), and
 * re-thrown as {@link ConfigurationError}.
 *
 * @param log - The logger instance for output and diagnostics.
 * @param engine - The Liquid engine used to render substitutions.
 * @param input - The input string, possibly containing substitutions.
 * @param substitutionsVariables - The variables available for substitution.
 * @param maxIterations - Optional maximum number of substitution iterations
 * to prevent infinite loops from circular references. Defaults to 420.
 * @param maxOutputSize - Optional maximum output size in bytes to prevent
 * memory exhaustion from exponentially expanding templates. Defaults to 43008
 * bytes (42KB).
 * @returns The fully substituted string.
 *
 * @throws {@link TemplateError}
 * If Liquid rendering fails, iteration limit is exceeded, or output size
 * limit is exceeded.
 */
export declare function performSubstitutions({ engine, input, substitutionsVariables, log, maxIterations, maxOutputSize, }: {
    engine: LiquidEngine;
    input: string;
    substitutionsVariables: LiquidSubstitutionsVariables;
    log: Logger;
    maxIterations?: number;
    maxOutputSize?: number;
}): Promise<string>;
//# sourceMappingURL=perform-substitutions.d.ts.map