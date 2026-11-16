import { Logger } from '@xpack/logger';
import { LiquidEngine } from '../classes/liquid-engine.js';
import { LiquidSubstitutionsVariables } from '../data/substitutions-variables.js';
import { JsonTemplateMatrix } from '../types/json.js';
/**
 * Result of matrix validation and processing.
 *
 * @remarks
 * This interface encapsulates the processed matrix data ready for
 * Cartesian product generation.
 */
export interface ProcessedMatrix {
    /**
     * Array of matrix parameter names.
     */
    matrixKeys: string[];
    /**
     * Array of value arrays for each parameter.
     */
    matrixValues: string[][];
}
/**
 * Validates and processes a matrix object for template expansion.
 *
 * @remarks
 * This function extracts common matrix processing logic used by both
 * actions and build configurations template expansion. It validates the
 * matrix structure, performs Liquid substitutions on matrix values if needed,
 * and prepares the data for Cartesian product generation.
 *
 * Processing steps:
 *
 * <ol>
 * <li>Validates that each matrix property is an array of strings.</li>
 * <li>For each matrix parameter:
 *   <ul>
 *   <li>Collects the parameter name (key).</li>
 *   <li>Joins array values with line breaks for substitution.</li>
 *   <li>If values contain Liquid syntax, performs substitutions.</li>
 *   <li>Splits the result back into individual values.</li>
 *   </ul>
 * </li>
 * <li>Returns processed matrix keys and values ready for combination
 *   generation.</li>
 * </ol>
 *
 * Matrix value substitution enables dynamic matrix generation where matrix
 * values themselves can reference other substitution variables, enabling
 * flexible configuration without hardcoding platform-specific or
 * environment-specific values.
 *
 * @param matrix - The matrix object from JSON template.
 * @param templateName - The template name for error messages.
 * @param templateType - The template type ('action' or 'buildConfiguration')
 * for error messages.
 * @param engine - The Liquid engine for substitutions.
 * @param substitutionsVariables - The variables available for substitution.
 * @param log - The logger instance for diagnostics.
 * @returns The processed matrix keys and values.
 *
 * @throws {@link ConfigurationError}
 * If the matrix structure is invalid or substitution fails.
 */
export declare function processMatrixForExpansion({ matrix, templateName, templateType, engine, substitutionsVariables, log, }: {
    matrix: JsonTemplateMatrix;
    templateName: string;
    templateType: 'action' | 'buildConfiguration';
    engine: LiquidEngine;
    substitutionsVariables: LiquidSubstitutionsVariables;
    log: Logger;
}): Promise<ProcessedMatrix>;
//# sourceMappingURL=matrix-expander.d.ts.map