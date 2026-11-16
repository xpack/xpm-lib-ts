import { Logger } from '@xpack/logger';
import { LiquidSubstitutionsVariables } from '../data/substitutions-variables.js';
import { LiquidEngine } from './liquid-engine.js';
import { JsonTemplateMatrix } from '../types/json.js';
/**
 * Configuration parameters for constructing a template expander instance.
 *
 * @remarks
 * This interface defines the required configuration for creating an
 * instance of {@link TemplateExpander}. All properties are mandatory.
 *
 * The parameters provide the Liquid templating engine, substitution
 * variables hierarchy, and logger for diagnostic output during template
 * expansion operations.
 */
export interface TemplateExpanderConstructorParameters {
    /**
     * The Liquid templating engine for variable substitution.
     */
    engine: LiquidEngine;
    /**
     * The variables available for substitution in templates.
     */
    substitutionsVariables: LiquidSubstitutionsVariables;
    /**
     * The logger instance for output and diagnostics.
     */
    log: Logger;
}
/**
 * Callback function type for creating instances from template expansions.
 *
 * @remarks
 * This function is invoked for each combination generated during template
 * expansion. It receives the expanded name, matrix combination parameters,
 * and the template content, and must return a new instance of type
 * <code>TInstance</code>.
 *
 * The callback is responsible for:
 *
 * <ol>
 * <li>Creating the appropriate instance type (e.g., <code>Action</code> or
 *    <code>BuildConfiguration</code>).</li>
 * <li>Passing the expanded name to the instance constructor.</li>
 * <li>Storing the matrix parameters for later template evaluation.</li>
 * <li>Associating the template content with the instance.</li>
 * </ol>
 *
 * @typeParam TTemplate - The type of the template content (e.g.,
 * <code>JsonActionContent</code> or
 * <code>JsonBuildConfigurationContent</code>).
 * @typeParam TInstance - The type of instance to create (e.g.,
 * <code>Action</code> or <code>BuildConfiguration</code>).
 *
 * @param expandedName - The name after Liquid substitution with matrix
 * parameters (e.g., <code>test-x64</code> from
 * <code>test-\{\{ matrix.arch \}\}</code>).
 * @param combination - The matrix parameter values for this combination
 * (e.g., <code>\{ arch: 'x64', platform: 'linux' \}</code>).
 * @param templateContent - The template content to associate with the
 * instance.
 * @param originalTemplateName - The original template name before expansion
 * (e.g., <code>test-\{\{ matrix.arch \}\}</code>).
 * @returns The newly created instance.
 */
export type InstanceFactoryCallback<TTemplate, TInstance> = (expandedName: string, combination: Record<string, string>, templateContent: TTemplate, originalTemplateName: string) => TInstance;
/**
 * A generic template expansion engine for matrix-based template processing.
 *
 * @remarks
 * This class provides shared functionality for expanding template names
 * and creating multiple instances from a single template definition with
 * matrix parameters. It eliminates code duplication between
 * {@link Actions} and {@link BuildConfigurations} classes by extracting
 * the common template expansion logic.
 *
 * Template expansion process:
 *
 * <ol>
 * <li><b>Matrix processing:</b> Validates matrix structure and performs
 *    Liquid substitutions on matrix values.</li>
 * <li><b>Combination generation:</b> Computes the Cartesian product of all
 *    matrix parameter values.</li>
 * <li><b>Name expansion:</b> For each combination, substitutes matrix values
 *    into the template name.</li>
 * <li><b>Instance creation:</b> Invokes the factory callback to create
 *    instances with expanded names and matrix parameters.</li>
 * </ol>
 *
 * The class is generic to support different template and instance types
 * whilst maintaining type safety throughout the expansion process.
 *
 * @typeParam TTemplate - The type of template content (e.g.,
 * <code>JsonActionContent</code> or
 * <code>JsonBuildConfigurationContent</code>).
 * @typeParam TInstance - The type of instance to create (e.g.,
 * <code>Action</code> or <code>BuildConfiguration</code>).
 */
export declare class TemplateExpander<TTemplate, TInstance> {
    /**
     * The Liquid templating engine for variable substitution.
     */
    readonly engine: LiquidEngine;
    /**
     * The variables available for substitution in templates.
     */
    readonly substitutionsVariables: LiquidSubstitutionsVariables;
    /**
     * The logger instance for output and diagnostics.
     */
    readonly log: Logger;
    /**
     * Constructs a template expander instance.
     *
     * @param engine - The Liquid templating engine for variable substitution.
     * @param substitutionsVariables - The variables available for substitution
     * in templates.
     * @param log - The logger instance for output and diagnostics.
     */
    constructor({ engine, substitutionsVariables, log, }: TemplateExpanderConstructorParameters);
    /**
     * Expands a template into multiple instances based on matrix parameters.
     *
     * @remarks
     * This method orchestrates the template expansion process by validating
     * the matrix, generating all parameter combinations, expanding the
     * template name for each combination, and creating instances via the
     * factory callback.
     *
     * Processing steps:
     *
     * <ol>
     * <li>Processes the matrix to extract and validate parameter keys and
     *    values.</li>
     * <li>Generates all combinations using the Cartesian product.</li>
     * <li>For each combination:
     *   <ol>
     *   <li>Performs Liquid substitution on the template name with matrix
     *      parameters.</li>
     *   <li>Invokes the factory callback to create an instance.</li>
     *   <li>Stores the instance in the result map.</li>
     *   </ol>
     * </li>
     * </ol>
     *
     * The factory callback is responsible for creating the appropriate
     * instance type and associating it with the expanded name and matrix
     * parameters.
     *
     * @param templateName - The template name containing Liquid variables
     * (e.g., <code>test-\{\{ matrix.arch \}\}</code>).
     * @param matrix - The matrix object containing parameter definitions.
     * @param templateContent - The template content to pass to the factory.
     * @param templateType - A descriptive name for the template type (e.g.,
     * "action" or "buildConfiguration"), used in error messages.
     * @param instanceFactory - A callback function that creates instances from
     * expanded names and matrix combinations.
     * @returns A promise that resolves to a map of expanded names to their
     * corresponding instances.
     *
     * @throws {@link ConfigurationError}
     * If the matrix structure is invalid, template name substitution fails,
     * or the factory callback throws an error.
     */
    expandTemplate({ templateName, matrix, templateContent, templateType, instanceFactory, }: {
        templateName: string;
        matrix: JsonTemplateMatrix;
        templateContent: TTemplate;
        templateType: string;
        instanceFactory: InstanceFactoryCallback<TTemplate, TInstance>;
    }): Promise<Map<string, TInstance>>;
    /**
     * Expands a template name with matrix parameter substitutions.
     *
     * @remarks
     * This helper method performs Liquid template substitution on the template
     * name using the specific matrix combination values. It wraps the
     * substitution operation with error handling to provide context about
     * which template failed.
     *
     * The method adds the matrix parameters to the substitution variables
     * hierarchy under the <code>matrix</code> namespace, making them
     * accessible in Liquid templates via syntax like
     * <code>\{\{ matrix.arch \}\}</code>.
     *
     * @param templateName - The template name containing Liquid variables.
     * @param combination - The matrix parameter values for this combination.
     * @param templateType - A descriptive name for the template type, used in
     * error messages.
     * @returns A promise that resolves to the expanded name after substitution.
     *
     * @throws {@link ConfigurationError}
     * If Liquid substitution fails, with context about the template name.
     */
    protected _expandName({ templateName, combination, templateType, }: {
        templateName: string;
        combination: Record<string, string>;
        templateType: string;
    }): Promise<string>;
}
//# sourceMappingURL=template-expander.d.ts.map