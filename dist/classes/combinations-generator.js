import assert from 'node:assert';
import { ConfigurationError } from './errors.js';
export const COMBINATIONS_GENERATOR_MAX_COMBINATIONS_LIMIT = 42 * 10;
export class CombinationsGenerator {
    _log;
    _matrixKeys;
    _matrixValues;
    _maxCombinations;
    constructor({ matrixKeys, matrixValues, maxCombinations = COMBINATIONS_GENERATOR_MAX_COMBINATIONS_LIMIT, log, }) {
        this._log = log;
        this._matrixKeys = matrixKeys;
        this._matrixValues = matrixValues;
        this._maxCombinations = maxCombinations;
        log.trace(`${CombinationsGenerator.name}.constructor: ` +
            `matrixKeys=${JSON.stringify(this._matrixKeys)} ` +
            `matrixValues=${JSON.stringify(this._matrixValues)}`);
    }
    *generate() {
        if (this._matrixKeys.length === 0) {
            return;
        }
        const totalCombinations = this._matrixValues.reduce((product, values) => product * values.length, 1);
        if (totalCombinations > this._maxCombinations) {
            throw new ConfigurationError(`Matrix would generate ${String(totalCombinations)} combinations, ` +
                `exceeding limit of ${String(this._maxCombinations)}. ` +
                `Consider using fewer parameters or values.`);
        }
        yield* this._generateRecursively(0, {});
    }
    *_generateRecursively(index, combination) {
        const log = this._log;
        log.trace(`${CombinationsGenerator.name}.` +
            `_generateRecursively(${String(index)},` +
            `${JSON.stringify(combination)})`);
        if (index === this._matrixKeys.length) {
            log.trace('combination complete =>', combination);
            yield { ...combination };
            return;
        }
        const key = this._matrixKeys[index];
        const values = this._matrixValues[index];
        assert(key !== undefined, 'key must be defined');
        assert(values !== undefined, 'values must be defined');
        for (const value of values) {
            combination[key] = value;
            yield* this._generateRecursively(index + 1, combination);
            delete combination[key];
        }
    }
}
//# sourceMappingURL=combinations-generator.js.map