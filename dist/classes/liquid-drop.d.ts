import * as liquidjs from 'liquidjs';
import { Logger } from '@xpack/logger';
import { LiquidSubstitutionsStrings } from '../data/substitutions-variables.js';
/**
 * Configuration parameters for constructing a properties drop instance.
 *
 * @remarks
 * This interface defines the required configuration for creating an
 * instance of {@link LiquidPropertiesDrop}. All properties are mandatory.
 *
 * The parameters provide the Liquid engine for nested template evaluation,
 * the properties map for value lookups, and the logger for diagnostic
 * output during property resolution and substitution.
 */
export interface LiquidPropertiesDropConstructorParameters {
    /**
     * The Liquid engine used to render nested substitutions.
     */
    engine: liquidjs.Liquid;
    /**
     * The properties map used for substitutions.
     */
    properties: LiquidSubstitutionsStrings;
    /**
     * The logger instance for output and diagnostics.
     */
    log: Logger;
}
/**
 * Liquid drop that resolves `property` values for template substitutions.
 *
 * @remarks
 * This drop exposes properties to the Liquid engine and performs
 * additional substitutions when a property value itself contains Liquid syntax.
 *
 * Implements the Liquid Drop pattern to provide lazy property resolution and
 * recursive template evaluation. When a template accesses `properties.foo`,
 * the Liquid engine calls {@link LiquidPropertiesDrop.liquidMethodMissing}
 * which:
 *
 * <ol>
 * <li>Looks up the property value in the properties map.</li>
 * <li>Checks if the value contains Liquid syntax
 *   (<code>\{\{</code> or <code>\{%</code>).</li>
 * <li>If yes, recursively evaluates the value as a Liquid template.</li>
 * <li>Returns the final resolved value.</li>
 * </ol>
 *
 * This enables multi-level property references where one property can
 * reference another, which can reference yet another, with the engine
 * automatically resolving the entire chain.
 */
export declare class LiquidPropertiesDrop extends liquidjs.Drop {
    /**
     * The logger instance for output and diagnostics.
     */
    protected readonly _log: Logger;
    /**
     * The properties map used for substitutions.
     */
    protected readonly _properties: LiquidSubstitutionsStrings;
    /**
     * The Liquid engine used to render nested substitutions.
     */
    protected readonly _engine: liquidjs.Liquid;
    /**
     * Constructs a properties drop.
     *
     * @param engine - The Liquid engine used to render nested substitutions.
     * @param properties - The properties map used for substitutions.
     * @param log - The logger instance for output and diagnostics.
     */
    constructor({ engine, properties, log, }: LiquidPropertiesDropConstructorParameters);
    /**
     * Resolves a missing property and performs nested substitutions.
     *
     * @remarks
     * Called by the Liquid engine when a property is accessed that doesn't
     * exist as a regular method. This implements the Drop pattern for dynamic
     * property resolution.
     *
     * Resolution process:
     *
     * <ol>
     * <li>Validate the property exists, throw <code>InputError</code> if
     * not.</li>
     * <li>Retrieve the property value (string, array, or object).</li>
     * <li>If object, return as-is for Liquid to access nested properties.</li>
     * <li>If array, join elements into a single string for processing.</li>
     * <li>If the value contains Liquid syntax, recursively render it with the
     *    current context to resolve nested references.</li>
     * <li>Return the final resolved value.</li>
     * </ol>
     *
     * Array values are concatenated without separators, allowing properties
     * to span multiple lines in JSON while producing a single string output.
     *
     * @param key - The property name requested by the template.
     * @param context - The Liquid rendering context.
     * @returns The resolved property value.
     *
     * @throws {@link TemplateError}
     * If the property is not defined.
     */
    liquidMethodMissing(key: string, context: liquidjs.Context): Promise<any>;
}
/**
 * Configuration parameters for constructing a matrix drop instance.
 *
 * @remarks
 * This interface defines the required configuration for creating an
 * instance of {@link LiquidMatrixDrop}. All properties are mandatory.
 *
 * The parameters provide the Liquid engine for nested template evaluation,
 * the matrix parameters map for value lookups, and the logger for diagnostic
 * output during matrix parameter resolution and substitution.
 */
export interface LiquidMatrixDropConstructorParameters {
    /**
     * The Liquid engine used to render nested substitutions.
     */
    engine: liquidjs.Liquid;
    /**
     * The matrix parameters map used for substitutions.
     */
    matrix: LiquidSubstitutionsStrings;
    /**
     * The logger instance for output and diagnostics.
     */
    log: Logger;
}
/**
 * Liquid drop that resolves `matrix` parameter values for templates.
 *
 * @remarks
 * This drop exposes matrix values to the Liquid engine and performs
 * nested substitutions when a matrix value contains Liquid syntax.
 *
 * Matrix parameters are used during template expansion to generate multiple
 * actions or build configurations from a single template definition. Each
 * expanded instance receives a specific combination of matrix values.
 *
 * Implements the same Drop pattern as {@link LiquidPropertiesDrop} but
 * for matrix-scoped variables. When a template accesses `matrix.arch`, the
 * engine calls {@link LiquidMatrixDrop.liquidMethodMissing} which resolves
 * the parameter value and recursively evaluates any nested Liquid syntax.
 *
 * Matrix parameters are isolated per template instance, ensuring that each
 * generated action or configuration has access only to its specific matrix
 * combination.
 */
export declare class LiquidMatrixDrop extends liquidjs.Drop {
    /**
     * The logger instance for output and diagnostics.
     */
    protected readonly _log: Logger;
    /**
     * The matrix parameters map used for substitutions.
     */
    protected readonly _matrix: LiquidSubstitutionsStrings;
    /**
     * The Liquid engine used to render nested substitutions.
     */
    protected readonly _engine: liquidjs.Liquid;
    /**
     * Constructs a matrix drop.
     *
     * @param engine - The Liquid engine used to render nested substitutions.
     * @param matrix - The matrix parameters map used for substitutions.
     * @param log - The logger instance for output and diagnostics.
     */
    constructor({ engine, matrix, log }: LiquidMatrixDropConstructorParameters);
    /**
     * Resolves a missing matrix parameter and performs nested substitutions.
     *
     * @remarks
     * Called by the Liquid engine when a matrix parameter is accessed that
     * doesn't exist as a regular method. This implements the Drop pattern for
     * dynamic matrix parameter resolution.
     *
     * Resolution process:
     *
     * <ol>
     * <li>Validate the parameter exists, throw <code>InputError</code> if
     * not.</li>
     * <li>Retrieve the parameter value (string, array, or object).</li>
     * <li>If object, return as-is for Liquid to access nested properties.</li>
     * <li>If array, join elements into a single string for processing.</li>
     * <li>If the value contains Liquid syntax, recursively render it with the
     *    current context to resolve nested references.</li>
     * <li>Return the final resolved value.</li>
     * </ol>
     *
     * This mirrors the behavior of {@link LiquidPropertiesDrop} but operates
     * on matrix parameters instead of properties. Matrix values can reference
     * other substitution variables, enabling complex template expansions.
     *
     * @param key - The matrix parameter name requested by the template.
     * @param context - The Liquid rendering context.
     * @returns The resolved matrix parameter value.
     *
     * @throws {@link TemplateError}
     * If the matrix parameter is not defined.
     */
    liquidMethodMissing(key: string, context: liquidjs.Context): Promise<any>;
}
//# sourceMappingURL=liquid-drop.d.ts.map