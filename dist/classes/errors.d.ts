/**
 * Error indicating a syntax error in configuration or template files.
 *
 * @remarks
 * This error is thrown when parsing JSON files.
 * This typically occurs during the parsing phase before semantic
 * validation. Use this error when the structure of the input is
 * malformed, as opposed to {@link InputError} or
 * {@link ConfigurationError} which indicate
 * semantically invalid but syntactically correct input.
 */
export declare class JsonSyntaxError extends Error {
}
/**
 * Error indicating that required prerequisites are not met.
 *
 * @remarks
 * This error is thrown when dependencies, tools, or system requirements
 * necessary for an operation are missing or incompatible. Common scenarios
 * include missing npm packages, unavailable system tools, unsupported
 * platform versions, or insufficient <b>xpm</b> version requirements. Use this
 * error when validation of the execution environment fails before
 * attempting an operation.
 */
export declare class PrerequisitesError extends Error {
}
/**
 * Error indicating a configuration issue.
 *
 * @remarks
 * This error is thrown when configuration files, such as `package.json`,
 * contain invalid values, missing required fields, circular references, or
 * other issues that prevent proper initialisation or execution. Use this error
 * when the problem is related to the content of configuration files rather
 * than user input or output generation.
 */
export declare class ConfigurationError extends Error {
}
/**
 * Error indicating a template evaluation failure.
 *
 * @remarks
 * This error is thrown when Liquid template rendering fails during output
 * generation. Common scenarios include undefined variables in templates,
 * invalid filter usage, template syntax errors caught during evaluation,
 * circular template references, or template size limit exceeded. This differs
 * from {@link ConfigurationError} which indicates issues in the template
 * configuration structure itself, and {@link OutputError} which indicates
 * file system or broader output failures.
 */
export declare class TemplateError extends Error {
}
/**
 * Error indicating that user input is invalid.
 *
 * @remarks
 * This error is thrown when command-line arguments,
 * or other user-provided input fails validation. Common scenarios
 * include invalid property values, missing required fields,
 * out-of-range parameter values, missing files or directories, or other
 * issues that prevent proper execution. The error message should clearly
 * indicate what input was invalid and why, helping users correct their
 * configuration or arguments.
 */
export declare class InputError extends Error {
}
/**
 * Error indicating a failure during output generation.
 *
 * @remarks
 * This error is thrown when file generation, Liquid template rendering,
 * or other output operations fail. Common scenarios include template
 * evaluation errors, file system write failures, or variable substitution
 * problems. This error indicates that the input was valid but the
 * transformation or output process encountered a problem during execution.
 */
export declare class OutputError extends Error {
}
//# sourceMappingURL=errors.d.ts.map