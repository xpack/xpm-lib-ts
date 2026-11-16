import assert from 'node:assert';
import * as util from 'node:util';
import * as readline from 'node:readline/promises';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { isString, isObject, isBoolean, isNumber, } from '../functions/is-something.js';
import { JsonSyntaxError, InputError, OutputError, ConfigurationError, } from './errors.js';
import { LiquidEngine } from './liquid-engine.js';
import { liquidSubstitutionsVariablesBase } from '../data/substitutions-variables.js';
export class InitTemplateBase {
    context;
    log;
    propertiesDefinitions = {};
    templatesFolderPath;
    engine;
    substitutionsVariables;
    isInteractive = false;
    process;
    policies;
    constructor({ context, templatesFolderPath, propertiesDefinitions, process: _process = process, options, policies, }) {
        assert(context, 'context is required');
        assert(context.log, 'context.log is required');
        assert(context.config, 'context.config is required');
        assert(context.config.projectName, 'context.config.projectName is required');
        assert(context.config.properties, 'context.config.properties is required');
        assert(context.rootPath, 'context.rootPath is required');
        assert(templatesFolderPath, 'templatesPath is required');
        assert(propertiesDefinitions, 'propertiesDefinitions is required');
        this.context = context;
        this.log = context.log;
        this.propertiesDefinitions = propertiesDefinitions;
        this.templatesFolderPath = templatesFolderPath;
        this.process = _process;
        this.policies = policies;
        this._validatePropertiesDefinitions();
        this.engine = new LiquidEngine({
            options: {
                ...options,
                root: this.templatesFolderPath,
            },
        });
    }
    async run() {
        const log = this.log;
        log.trace(`${this.constructor.name}.run()`);
        log.info();
        const context = this.context;
        const config = context.config;
        assert(config.properties, 'config.properties is required');
        const validationErrors = [];
        for (const [key, val] of Object.entries(config.properties)) {
            try {
                config.properties[key] = this.validatePropertyValue(key, val);
            }
            catch (error) {
                if (error instanceof Error) {
                    const errorMessage = `${key}: ${error.message}`;
                    log.error(errorMessage);
                    validationErrors.push(errorMessage);
                }
            }
        }
        if (validationErrors.length > 0) {
            throw new JsonSyntaxError(validationErrors.length === 1
                ? '1 invalid property'
                : `${String(validationErrors.length)} invalid properties`);
        }
        const mustAsk = Object.entries(this.propertiesDefinitions).some(([key, definition]) => {
            return definition.isMandatory && !config.properties?.[key];
        });
        let isInteractive;
        if (mustAsk) {
            if (!(this.process.stdin.isTTY && this.process.stdout.isTTY)) {
                throw new JsonSyntaxError('Interactive mode not possible without a TTY.');
            }
            await this._askForMoreValues();
            log.trace(util.inspect(config.properties));
            context.startTime = Date.now();
            isInteractive = true;
        }
        else {
            Object.entries(this.propertiesDefinitions).forEach(([key, val]) => {
                assert(config.properties, 'config.properties is required');
                if (!config.properties[key] && val.default !== undefined) {
                    config.properties[key] = val.default;
                }
            });
            isInteractive = false;
        }
        this.isInteractive = isInteractive;
        const currentTime = new Date();
        let substitutionsVariables;
        if (this.policies.topPropertiesXpmInitTemplate) {
            substitutionsVariables = {
                ...config.properties,
                properties: config.properties,
                propertiesNames: Object.keys(config.properties),
                projectName: config.projectName,
                year: currentTime.getFullYear().toString(),
            };
        }
        else {
            substitutionsVariables = {
                ...liquidSubstitutionsVariablesBase,
                matrix: {
                    ...config.properties,
                },
                propertiesNames: Object.keys(config.properties),
                projectName: config.projectName,
                year: currentTime.getFullYear().toString(),
            };
        }
        this.substitutionsVariables = substitutionsVariables;
        await this.generate();
        return 0;
    }
    isPlatformSupported(platforms) {
        assert(platforms && platforms.length !== 0, 'platforms array is required');
        if (platforms.includes(`${this.process.platform}-${this.process.arch}`)) {
            return true;
        }
        if (platforms.includes(this.process.platform)) {
            return true;
        }
        return false;
    }
    async copyFile({ sourceFileRelativePath, destinationFilePath = sourceFileRelativePath, }) {
        assert(sourceFileRelativePath, 'sourceFileRelativePath is required');
        assert(destinationFilePath, 'destinationFilePath is required');
        const log = this.log;
        const destinationFileRelativePath = path.relative(this.context.config.cwd, destinationFilePath);
        log.info(`Copying file '${destinationFileRelativePath}'...`);
        await fs.mkdir(path.dirname(destinationFilePath), { recursive: true });
        const sourceFileAbsolutePath = path.resolve(this.templatesFolderPath, sourceFileRelativePath);
        await fs.copyFile(sourceFileAbsolutePath, destinationFilePath);
    }
    async copyFolder({ sourceFolderRelativePath, destinationFolderPath = sourceFolderRelativePath, }) {
        assert(sourceFolderRelativePath, 'sourceFolderRelativePath is required');
        assert(destinationFolderPath, 'destinationFolderPath is required');
        const log = this.log;
        log.info(`Copying folder '${destinationFolderPath}'...`);
        const sourceFolderAbsolutePath = path.resolve(this.templatesFolderPath, sourceFolderRelativePath);
        await this._copyFolderRecursively({
            sourceFolderPath: sourceFolderAbsolutePath,
            destinationFolderPath: path.resolve(destinationFolderPath),
        });
    }
    async render({ sourceFilePath, destinationFilePath, substitutionsVariables = this.substitutionsVariables, }) {
        assert(sourceFilePath, 'sourceFilePath is required');
        assert(destinationFilePath, 'destinationFilePath is required');
        assert(substitutionsVariables !== undefined, 'substitutionsVariables is required for rendering templates. ' +
            'Ensure that run() has been called to prepare the variables.');
        const log = this.log;
        const context = this.context;
        const config = context.config;
        const cwd = config.cwd;
        const sourceFileRelativePath = path.relative(cwd, sourceFilePath);
        const destinationFileRelativePath = path.relative(cwd, destinationFilePath);
        log.info(`Rendering template '${sourceFileRelativePath}' as ` +
            `'${destinationFileRelativePath}'...`);
        log.trace(`render(${sourceFilePath}, ${destinationFilePath})`);
        try {
            const fileContent = (await this.engine.renderFile(sourceFilePath, substitutionsVariables));
            await fs.mkdir(path.dirname(destinationFilePath), { recursive: true });
            await fs.writeFile(destinationFilePath, fileContent, 'utf8');
        }
        catch (error) {
            if (error instanceof Error) {
                throw new OutputError(error.message);
            }
        }
    }
    validatePropertyValue(name, value) {
        const propDef = this.propertiesDefinitions[name];
        if (propDef === undefined) {
            throw new ConfigurationError(`Unsupported property '${name}'`);
        }
        const trimmedValue = value.trim();
        if (trimmedValue === '') {
            if (propDef.default !== undefined) {
                return propDef.default;
            }
        }
        else {
            switch (propDef.type) {
                case 'select':
                    assert(propDef.items, `Property '${name}' of type 'select' has no items.`);
                    if (propDef.items[value]) {
                        if (typeof propDef.items[value] === 'string') {
                            return value;
                        }
                        else if (typeof propDef.items[value] === 'object' &&
                            this.isPlatformSupported(propDef.items[value].platforms)) {
                            return value;
                        }
                    }
                    break;
                case 'boolean':
                    if (trimmedValue === 'true') {
                        return true;
                    }
                    else if (trimmedValue === 'false') {
                        return false;
                    }
                    break;
                case 'number': {
                    const num = Number(trimmedValue);
                    if (isFinite(num)) {
                        return num;
                    }
                    break;
                }
                case 'string':
                    return value;
            }
        }
        throw new ConfigurationError(`Unsupported value '${value}' for property '${name}'`);
    }
    async _askForMoreValues() {
        const context = this.context;
        const config = context.config;
        assert(config.properties, 'config.properties is required');
        const rl = readline.createInterface({
            input: this.process.stdin,
            output: this.process.stdout,
        });
        for (const [name, definition] of Object.entries(this.propertiesDefinitions)) {
            if (config.properties[name]) {
                continue;
            }
            let prompt = `${definition.label}?`;
            switch (definition.type) {
                case 'select': {
                    prompt += ' (';
                    const validItems = [];
                    assert(definition.items, 'definition.items is required');
                    for (const [ikey, ival] of Object.entries(definition.items)) {
                        if (isString(ival)) {
                            validItems.push(ikey);
                        }
                        else if (isObject(ival) &&
                            this.isPlatformSupported(ival.platforms)) {
                            validItems.push(ikey);
                        }
                    }
                    prompt += validItems.join(', ');
                    prompt += ', ?)';
                    break;
                }
                case 'string':
                    prompt += ' (string, ?)';
                    break;
                case 'number':
                    prompt += ' (number, ?)';
                    break;
                case 'boolean':
                    prompt += ' (true, false, ?)';
                    break;
            }
            if (definition.default !== undefined) {
                prompt += ` [${String(definition.default)}]`;
            }
            prompt += ': ';
            const MAX_RETRIES = 42;
            let retryCount = 0;
            while (true) {
                if (++retryCount > MAX_RETRIES) {
                    throw new InputError(`Too many invalid attempts for property '${name}' ` +
                        `(limit: ${String(MAX_RETRIES)})`);
                }
                const answer = (await rl.question(prompt)).trim();
                try {
                    const value = this.validatePropertyValue(name, answer);
                    config.properties[name] = value;
                    break;
                }
                catch (error) {
                    if (error instanceof Error) {
                        this.log.trace(error.message);
                    }
                    this.process.stdout.write(`${definition.description}\n`);
                    if (definition.type === 'select') {
                        assert(definition.items, 'definition.items is required');
                        for (const [ikey, ival] of Object.entries(definition.items)) {
                            if (isString(ival)) {
                                this.process.stdout.write(`- ${ikey}: ${ival}\n`);
                            }
                            else if (isObject(ival) &&
                                this.isPlatformSupported(ival.platforms)) {
                                this.process.stdout.write(`- ${ikey}: ${ival.message}\n`);
                            }
                        }
                    }
                }
            }
        }
    }
    async _copyFolderRecursively({ sourceFolderPath, destinationFolderPath, }) {
        await fs.mkdir(destinationFolderPath, { recursive: true });
        const dirents = await fs.readdir(sourceFolderPath, {
            withFileTypes: true,
        });
        for (const dirent of dirents) {
            if (dirent.isDirectory()) {
                await this._copyFolderRecursively({
                    sourceFolderPath: path.join(sourceFolderPath, dirent.name),
                    destinationFolderPath: path.join(destinationFolderPath, dirent.name),
                });
            }
            else {
                await fs.copyFile(path.join(sourceFolderPath, dirent.name), path.join(destinationFolderPath, dirent.name));
            }
        }
    }
    _validatePropertiesDefinitions() {
        assert(isObject(this.propertiesDefinitions), 'propertiesDefinitions is not an object.');
        assert(Object.keys(this.propertiesDefinitions).length > 0, 'propertiesDefinitions is an empty object.');
        for (const [key, val] of Object.entries(this.propertiesDefinitions)) {
            assert(isString(val.label), `Property '${key}' must have a string label`);
            assert(val.label.trim() !== '', `Property '${key}' has an empty label`);
            assert(isString(val.description), `Property '${key}' must have a string description`);
            assert(val.description.trim() !== '', `Property '${key}' has an empty description`);
            if (val.isMandatory !== undefined) {
                assert(isBoolean(val.isMandatory), `Property '${key}' has a non boolean isMandatory value.`);
            }
            assert(val.type !== undefined, `Property '${key}' has no type defined.`);
            switch (val.type) {
                case 'select':
                    assert(val.items !== undefined, `Property '${key}' of type 'select' has no items.`);
                    assert(isObject(val.items), `Property '${key}' of type 'select' has invalid items.`);
                    assert(Object.keys(val.items).length !== 0, `Property '${key}' of type 'select' has no items.`);
                    for (const [ikey, ival] of Object.entries(val.items)) {
                        assert(isString(ival) ||
                            (isObject(ival) &&
                                Array.isArray(ival.platforms) &&
                                isString(ival.message)), `Property '${key}' has invalid item '${ikey}'.`);
                    }
                    if (!val.isMandatory) {
                        assert(val.default !== undefined, `Property '${key}' of type 'select' ` +
                            `must have a default value if not mandatory.`);
                    }
                    if (val.default !== undefined) {
                        assert(isString(val.default), `Property '${key}' has a non string default value.`);
                        assert(val.default.trim() !== '', `Property '${key}' has an empty default value.`);
                    }
                    if (val.default !== undefined) {
                        assert(Object.keys(val.items).includes(String(val.default)), `Property '${key}' has a default value not in items list.`);
                    }
                    break;
                case 'string':
                    if (val.default !== undefined) {
                        assert(isString(val.default), `Property '${key}' has a non string default value.`);
                        assert(val.default.trim() !== '', `Property '${key}' has an empty default value.`);
                    }
                    break;
                case 'number':
                    if (val.default !== undefined) {
                        assert(isNumber(val.default), `Property '${key}' has a non number default value.`);
                    }
                    break;
                case 'boolean':
                    if (val.default !== undefined) {
                        assert(isBoolean(val.default), `Property '${key}' has a non boolean default value.`);
                    }
                    break;
                default:
                    assert(false, `Property '${key}' has unsupported type '${String(val.type)}'.`);
                    break;
            }
        }
    }
}
//# sourceMappingURL=init-template-base.js.map