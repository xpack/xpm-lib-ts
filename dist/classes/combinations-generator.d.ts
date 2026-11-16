import { Logger } from '@xpack/logger';
/**
 * The default maximum number of combinations that can be generated.
 *
 * @remarks
 * This constant defines the default limit for the total number of
 * combinations that a {@link CombinationsGenerator} instance can produce.
 * The limit exists to prevent performance issues and memory exhaustion when
 * working with large matrices.
 *
 * This value can be overridden by providing a custom `maxCombinations`
 * parameter when constructing a {@link CombinationsGenerator} instance.
 *
 * The limit is intentionally low (42 * 10).
 */
export declare const COMBINATIONS_GENERATOR_MAX_COMBINATIONS_LIMIT: number;
/**
 * A matrix combination mapping parameter names to their values.
 *
 * @remarks
 * This type represents a single combination generated from a matrix of
 * parameters, where each key is a parameter name and each value is a
 * string from that parameter's array of possible values.
 *
 * Example: `{ arch: 'x64', platform: 'linux', optimize: 'speed' }`
 */
export type MatrixCombination = Record<string, string>;
/**
 * Configuration parameters for constructing a combinations generator instance.
 *
 * @remarks
 * This interface defines the required configuration for creating an
 * instance of {@link CombinationsGenerator}. All properties are mandatory.
 *
 * The parameters provide the matrix parameter names, their corresponding
 * value arrays for Cartesian product computation, and the logger for
 * diagnostic output during combination generation.
 */
export interface CombinationsGeneratorConstructorParameters {
    /**
     * The array of parameter names.
     */
    matrixKeys: string[];
    /**
     * The array of value arrays for each parameter.
     */
    matrixValues: string[][];
    /**
     * The logger instance for output and diagnostics.
     */
    log: Logger;
    /**
     * Optional maximum combinations limit to prevent excessive generation.
     *
     * @remarks
     * This parameter allows configuring a custom limit on the total number of
     * combinations that can be generated. If the calculated total exceeds this
     * limit, a {@link ConfigurationError} is thrown to prevent performance
     * issues or memory exhaustion. The default value is 10,000 combinations.
     */
    maxCombinations?: number;
}
/**
 * Generates all possible combinations from a matrix of parameters.
 *
 * @remarks
 * This class computes the Cartesian product of multiple parameter arrays,
 * producing all possible combinations of parameter values using a
 * memory-efficient generator pattern. It uses a recursive algorithm to
 * systematically explore all combinations one at a time.
 *
 * The generation process:
 *
 * <ol>
 * <li>Takes arrays of parameter names (keys) and their corresponding value
 *    arrays.</li>
 * <li>Recursively iterates through each parameter, selecting one value at a
 *    time.</li>
 * <li>Yields complete combinations one at a time without storing them all
 *    in memory.</li>
 * <li>Backtracks to explore other value combinations.</li>
 * </ol>
 *
 * Example usage:
 * ```typescript
 * const generator = new CombinationsGenerator({
 *   matrixKeys: ['arch', 'optimize'],
 *   matrixValues: [['x64', 'arm'], ['speed', 'size']],
 *   log
 * });
 * for (const combo of generator.generate()) {
 *   // Process one combination at a time without storing all in memory
 *   // Results:
 *   //   { arch: 'x64', optimize: 'speed' }
 *   //   { arch: 'x64', optimize: 'size' }
 *   //   { arch: 'arm', optimize: 'speed' }
 *   //   { arch: 'arm', optimize: 'size' }
 *   await processConfiguration(combo);
 * }
 * ```
 */
export declare class CombinationsGenerator {
    /**
     * The logger instance for output and diagnostics.
     *
     * @remarks
     * This logger provides trace-level diagnostics during combination
     * generation, enabling visibility into the recursive exploration of the
     * parameter space without impacting performance when tracing is disabled.
     */
    protected readonly _log: Logger;
    /**
     * The array of parameter names.
     *
     * @remarks
     * This array contains the names of all matrix parameters in the order
     * they should be processed during combination generation. Each key
     * corresponds to a parameter that will appear in the generated
     * combinations.
     */
    protected readonly _matrixKeys: string[];
    /**
     * The array of value arrays for each parameter.
     *
     * @remarks
     * This two-dimensional array contains the possible values for each
     * parameter. The outer array corresponds one-to-one with
     * <code>matrixKeys</code>, where <code>matrixValues[i]</code> contains
     * all possible values for the parameter <code>matrixKeys[i]</code>.
     *
     * The Cartesian product of all these value arrays produces the complete
     * set of combinations.
     */
    protected readonly _matrixValues: string[][];
    /**
     * The maximum number of combinations allowed.
     *
     * @remarks
     * This limit prevents excessive generation of combinations, protecting
     * against performance issues and memory exhaustion.
     */
    protected readonly _maxCombinations: number;
    /**
     * Constructs a combinations generator instance.
     *
     * @param matrixKeys - The array of parameter names.
     * @param matrixValues - The array of value arrays for each parameter.
     * @param log - The logger instance for output and diagnostics.
     *
     * @remarks
     * The constructor validates that the structure of keys and values is
     * correct and prepares the generator for combination generation. The
     * actual generation is performed by calling `*generate`.
     */
    constructor({ matrixKeys, matrixValues, maxCombinations, log, }: CombinationsGeneratorConstructorParameters);
    /**
     * Generates combinations one at a time using a generator pattern.
     *
     * @remarks
     * This method yields combinations one at a time instead of building the
     * entire array in memory. This is particularly useful for large matrices
     * where storing all combinations would be impractical.
     *
     * Memory efficiency:
     *
     * <ul>
     * <li>For a matrix with 10 parameters and 5 values each (9,765,625
     *    combinations), only one combination object exists in memory at a
     *    time, regardless of matrix size.</li>
     * <li>No array allocation or storage required.</li>
     * <li>Immediate processing of each combination without waiting for all to
     *    be generated.</li>
     * </ul>
     *
     * Example usage:
     * ```typescript
     * for (const combo of generator.generate()) {
     *   // Process one combination at a time
     *   await processConfiguration(combo)
     * }
     * ```
     *
     * <b>Yields:</b> Individual matrix combinations one at a time.
     */
    generate(): Generator<MatrixCombination>;
    /**
     * Recursively generates combinations as a generator, yielding one at
     * a time.
     *
     * @remarks
     * This method implements the recursive algorithm for generating the
     * Cartesian product of parameter values using the generator pattern.
     *
     * Algorithm steps:
     *
     * <ol>
     * <li><b>Base case:</b> If all parameters have been assigned values
     *    (<code>index === matrixKeys.length</code>), yield a copy of the
     *    current combination and return.</li>
     * <li><b>Recursive case:</b> For the parameter at the current index:
     *   <ul>
     *   <li>Iterate through all possible values for this parameter.</li>
     *   <li>Assign each value to the combination object.</li>
     *   <li>Recursively yield combinations for the next parameter using
     *      <code>yield*</code>.</li>
     *   <li>Remove the assigned value (backtrack) before trying the next
     *      value.</li>
     *   </ul>
     * </li>
     * </ol>
     *
     * The combination object is reused and modified during traversal, with
     * only copies of complete combinations being yielded. This approach
     * minimises memory allocation whilst maintaining correctness.
     *
     * @param index - The current parameter index being processed.
     * @param combination - The partial combination being built.
     *
     * <b>Yields:</b> Complete combinations one at a time.
     */
    protected _generateRecursively(index: number, combination: Record<string, string>): Generator<MatrixCombination>;
}
//# sourceMappingURL=combinations-generator.d.ts.map