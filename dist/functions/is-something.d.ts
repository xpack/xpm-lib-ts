/**
 * Determines whether a value is a JavaScript primitive.
 *
 * @remarks
 * In JavaScript, primitives are immutable values that are not objects:
 * `string`, `number`, `bigint`, `boolean`, `undefined`, and `symbol`.
 * This function
 * also treats null as a primitive, following JavaScript's `typeof` behavior
 * despite null being technically an object type.
 *
 * Returns `true` for: `string`, `number`, `bigint`, `boolean`, `undefined`,
 * `symbol`, and `null`.
 *
 * Returns `false` for: objects, arrays, functions, and class instances.
 *
 * Useful for distinguishing between value types and reference types when
 * processing JSON data or validating configuration inputs.
 *
 * @param value - The value to test.
 * @returns `true` if the value is a primitive or `null`, `false` otherwise.
 */
export declare function isPrimitive(value: unknown): boolean;
/**
 * Determines whether a value is a string.
 *
 * @remarks
 * This function acts as a TypeScript type guard, narrowing the type to
 * `string` within conditional blocks. This enables safe string operations
 * without type assertions.
 *
 * Example usage:
 * ```typescript
 * if (isString(value)) {
 *   // TypeScript knows value is a string here
 *   const length = value.length;
 * }
 * ```
 *
 * Only returns `true` for primitive string values, not String objects
 * created with `new String()`.
 *
 * @param value - The value to test.
 * @returns `true` if the value is a string, `false` otherwise.
 */
export declare function isString(value: unknown): boolean;
/**
 * Determines whether a value is a finite number.
 *
 * @remarks
 * This function validates that a value is both a number type and
 * mathematically finite, excluding `NaN`, `Infinity`, and `-Infinity`.
 * This is essential when validating numeric configuration values or
 * processing JSON data where numeric fields must contain valid,
 * computable values.
 *
 * Returns `true` for: all finite numeric values, including `0`, negative
 * numbers, and floating-point numbers.
 *
 * Returns `false` for: `NaN`, `Infinity`, `-Infinity`, strings, objects,
 * arrays, and any non-number types.
 *
 * Only returns `true` for primitive number values, not Number objects
 * created with `new Number()`.
 *
 * The finiteness check is crucial for mathematical operations and ensures
 * that numeric properties in `package.json` or configuration files contain
 * usable values rather than special numeric constants that could cause
 * unexpected behaviour in calculations.
 *
 * @param value - The value to test.
 * @returns `true` if the value is a finite number, `false` otherwise.
 */
export declare function isNumber(value: unknown): boolean;
/**
 * Determines whether a value is a boolean.
 *
 * @remarks
 * Tests for primitive boolean values (`true` or `false`). Useful when
 * validating configuration options or parsing JSON where boolean flags
 * need to be distinguished from truthy/falsy values.
 *
 * Only returns `true` for the primitive boolean values `true` and `false`,
 * not for boolean objects created with `new Boolean()`.
 *
 * Note: This does not check for truthy or falsy values - it only returns
 * `true` for actual boolean primitives. Use standard JavaScript truthiness
 * checks for conditional logic.
 *
 * @param value - The value to test.
 * @returns `true` if the value is a boolean, `false` otherwise.
 */
export declare function isBoolean(value: unknown): boolean;
/**
 * Determines whether a value is a non-array object.
 *
 * @remarks
 * This function distinguishes between objects and arrays, which is crucial
 * when processing JSON structures where both use the object type but require
 * different handling.
 *
 * Returns `true` for: plain objects, class instances, null and other
 * object types.
 *
 * Returns `false` for: arrays, primitives, and functions.
 *
 * Note: Arrays in JavaScript are objects, so this function explicitly
 * excludes them using `Array.isArray()`. Use {@link isJsonObject} for
 * stricter JSON object validation that also excludes `undefined` and `null`.
 *
 * @param value - The value to test.
 * @returns `true` if the value is a non-array object, `false` otherwise.
 */
export declare function isObject(value: unknown): boolean;
/**
 * Determines whether a value is a JSON object.
 *
 * @remarks
 * Validates that a value represents a JSON object, which is stricter than
 * JavaScript's general object type. This is essential when working with
 * parsed JSON data or `package.json` structures.
 *
 * Returns `true` for: plain objects (non-null,
 * non-primitive, non-array values).
 *
 * Returns `false` for: undefined, null, primitives (string, number,
 * boolean, etc.), and arrays.
 *
 * This is the primary validation function for JSON objects in the <b>xpm</b>
 * codebase, used extensively when parsing `package.json` sections like
 * `xpack.properties`, `xpack.buildConfigurations`, etc.
 *
 * @param value - The value to test.
 * @returns `true` if the value is a JSON object, `false` otherwise.
 */
export declare function isJsonObject(value: unknown): boolean;
/**
 * Determines whether a value is a JSON array.
 *
 * @remarks
 * Validates that a value represents a JSON array, excluding `undefined`.
 * This ensures the value is a proper array that could have been parsed
 * from JSON.
 *
 * Returns `true` for: any array, including empty arrays.
 *
 * Returns `false` for: undefined, null, objects, and primitives.
 *
 * The undefined check is important for distinguishing between optional
 * properties that are missing (undefined) versus properties that are
 * explicitly empty arrays. This is common in package.json where array
 * fields may be absent or present but empty.
 *
 * @param value - The value to test.
 * @returns `true` if the value is a JSON array, `false` otherwise.
 */
export declare function isJsonArray(value: unknown): boolean;
/**
 * Determines whether a value is a non-empty JSON object.
 *
 * @remarks
 * Combines JSON object validation with a non-empty check, ensuring the
 * object has at least one property. This is useful for validating
 * configuration sections that must contain data to be meaningful.
 *
 * Returns `true` for: objects with one or more enumerable properties.
 *
 * Returns `false` for: empty objects `{}`, undefined, null, primitives,
 * arrays, and any non-object types.
 *
 * The enumerable properties check uses `Object.keys()`, which only counts
 * own enumerable string-keyed properties, not inherited properties or
 * symbol-keyed properties.
 *
 * Common use cases include validating `xpack.actions`, `xpack.dependencies`,
 * and other `package.json` sections where an empty object would be
 * meaningless.
 *
 * @param value - The value to test.
 * @returns `true` if the value is a non-empty JSON object, `false` otherwise.
 */
export declare function isNonEmptyJsonObject(value: unknown): boolean;
//# sourceMappingURL=is-something.d.ts.map