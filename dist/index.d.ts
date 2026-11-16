/**
 * A Node.js TypeScript module with the core code for <b>xpm</b> and
 * <b>xpm enabled</b> projects.
 *
 * @remarks
 * This library groups together various classes and functions used in common
 * by <b>xpm</b> and the Visual Studio Code extension.
 *
 * The main functionality is to manage actions and build configurations,
 * especially those defined using Liquid templates.
 *
 * <h3>The Lazy Evaluation Mechanism</h3>
 *
 * Actions ({@link Actions}) and build configurations
 * ({@link BuildConfigurations}) implement a two-step lazy evaluation
 * process to avoid unnecessary operations:
 *
 * <ol>
 * <li><b>Name Expansion:</b> During collection initialisation, only
 *    the matrix of
 *    options is evaluated for each template, expanding template names into
 *    concrete action or configuration names without processing their
 * content.</li>
 * <li><b>Content Evaluation:</b> Later, when an action or build
 *    configuration is  actually accessed and initialised (via
 *    <code>Action.initialise()</code>
 *    or <code>BuildConfiguration.initialise()</code>), the template
 *    is fully
 *    evaluated and Liquid substitutions are performed.</li>
 * </ol>
 *
 * This approach ensures that only items that are actually used incur the cost
 * of template evaluation and variable substitution, significantly improving
 * performance for projects with many actions or configurations.
 *
 * @packageDocumentation
 */
export * from './functions/chmod-recursively.js';
export * from './functions/filter-paths.js';
export * from './functions/is-something.js';
export * from './functions/matrix-expander.js';
export * from './functions/perform-substitutions.js';
export * from './functions/utils.js';
export * from './classes/errors.js';
export * from './classes/init-template-base.js';
export * from './classes/actions.js';
export * from './classes/build-configurations.js';
export * from './classes/combinations-generator.js';
export * from './classes/liquid-drop.js';
export * from './classes/liquid-engine.js';
export * from './classes/data-model.js';
export * from './classes/package.js';
export * from './classes/platform-detector.js';
export * from './classes/policies.js';
export * from './classes/template-expander.js';
export * from './data/substitutions-variables.js';
export * from './types/json.js';
export * from './types/xpm-init-template.js';
export * from './types/xpm.js';
//# sourceMappingURL=index.d.ts.map