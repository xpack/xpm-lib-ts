import assert from 'node:assert';
import * as path from 'node:path';
import * as os from 'node:os';
import { filterPath } from '../functions/filter-paths.js';
import { isJsonObject, isString } from '../functions/is-something.js';
import { getErrorMessage, hasLiquidSyntax } from '../functions/utils.js';
import { performSubstitutions } from '../functions/perform-substitutions.js';
import { Actions } from './actions.js';
import { buildFolderRelativePathPropertyName } from './data-model.js';
import { ConfigurationError } from './errors.js';
import { TemplateExpander } from './template-expander.js';
export class BuildConfigurations {
    log;
    engine;
    substitutionsVariables;
    jsonBuildConfigurations;
    _buildConfigurationsMap = new Map();
    _jsonBuildConfigurationsNamesMap = new Map();
    _namesSet = new Set();
    _isInitialised = false;
    _names = [];
    constructor({ engine, substitutionsVariables, jsonBuildConfigurations, log, }) {
        assert(log, 'log is required');
        assert(engine, 'engine is required');
        assert(substitutionsVariables, 'substitutionsVariables is required');
        log.trace(`${BuildConfigurations.name}()`);
        this.log = log;
        this.engine = engine;
        this.substitutionsVariables = substitutionsVariables;
        this.jsonBuildConfigurations = jsonBuildConfigurations ?? {};
    }
    async initialise() {
        const log = this.log;
        if (this._isInitialised) {
            log.trace(`${BuildConfigurations.name}.initialise() again`);
            return false;
        }
        log.trace(`${BuildConfigurations.name}.initialise()`);
        for (const [buildConfigurationName, jsonBuildConfiguration,] of Object.entries(this.jsonBuildConfigurations)) {
            if (hasLiquidSyntax(buildConfigurationName)) {
                await this._processTemplate({
                    buildConfigurationName,
                    jsonBuildConfigurationTemplate: jsonBuildConfiguration,
                });
            }
            else {
                if (this._namesSet.has(buildConfigurationName)) {
                    throw new ConfigurationError(`build configuration name ` +
                        `"${buildConfigurationName}" already defined`);
                }
                else {
                    this._buildConfigurationsMap.set(buildConfigurationName, undefined);
                    this._jsonBuildConfigurationsNamesMap.set(buildConfigurationName, buildConfigurationName);
                    this._namesSet.add(buildConfigurationName);
                }
            }
        }
        const names = Array.from(this._buildConfigurationsMap.keys());
        this._names = names;
        log.trace(`${BuildConfigurations.name}.initialise() =>`, names);
        this._isInitialised = true;
        return true;
    }
    get size() {
        assert(this._isInitialised, 'BuildConfigurations collection must be initialised before ' +
            'accessing size');
        return this._buildConfigurationsMap.size;
    }
    get isEmpty() {
        assert(this._isInitialised, 'BuildConfigurations collection must be initialised before ' +
            'accessing isEmpty');
        return this._buildConfigurationsMap.size === 0;
    }
    get names() {
        assert(this._isInitialised, 'BuildConfigurations collection must be initialised before ' +
            'accessing names');
        return this._names;
    }
    getJsonName(buildConfigurationName) {
        assert(this._isInitialised, 'BuildConfigurations collection must be initialised before ' +
            'accessing getJsonName()');
        const name = this._jsonBuildConfigurationsNamesMap.get(buildConfigurationName);
        if (name === undefined) {
            throw new ConfigurationError(`build configuration "${buildConfigurationName}" does not exist`);
        }
        return name;
    }
    hasJson(buildConfigurationName) {
        assert(this._isInitialised, 'BuildConfigurations collection must be initialised before ' +
            'accessing hasJson()');
        return this._jsonBuildConfigurationsNamesMap.has(buildConfigurationName);
    }
    getJson(buildConfigurationName) {
        assert(this._isInitialised, 'BuildConfigurations collection must be initialised before ' +
            'accessing getJson()');
        const jsonBuildConfiguration = this.jsonBuildConfigurations[this.getJsonName(buildConfigurationName)];
        assert(jsonBuildConfiguration, 'jsonBuildConfiguration must be defined for a known name');
        return jsonBuildConfiguration;
    }
    isHidden(buildConfigurationName) {
        assert(this._isInitialised, 'BuildConfigurations collection must be initialised before ' +
            'accessing isHidden()');
        const jsonBuildConfigurationName = this.getJsonName(buildConfigurationName);
        if (jsonBuildConfigurationName.includes('{{')) {
            const jsonBuildConfigurationTemplate = this.jsonBuildConfigurations[jsonBuildConfigurationName];
            return jsonBuildConfigurationTemplate.template.hidden ?? false;
        }
        const jsonBuildConfigurationContent = this.jsonBuildConfigurations[jsonBuildConfigurationName];
        assert(jsonBuildConfigurationContent, 'jsonBuildConfigurationContent must be defined for a known name');
        return jsonBuildConfigurationContent.hidden ?? false;
    }
    has(buildConfigurationName) {
        assert(this._isInitialised, 'BuildConfigurations collection must be initialised before ' +
            'accessing has()');
        return this._buildConfigurationsMap.has(buildConfigurationName);
    }
    get(buildConfigurationName) {
        assert(this._isInitialised, 'BuildConfigurations collection must be initialised before ' +
            'accessing get()');
        const log = this.log;
        log.trace(`${BuildConfigurations.name}.get(${buildConfigurationName})`);
        let buildConfiguration = this._buildConfigurationsMap.get(buildConfigurationName);
        if (buildConfiguration === undefined) {
            const jsonBuildConfigurationName = this.getJsonName(buildConfigurationName);
            const jsonBuildConfiguration = this.jsonBuildConfigurations[jsonBuildConfigurationName] ?? {};
            buildConfiguration = new BuildConfiguration({
                buildConfigurationName,
                jsonBuildConfiguration,
                parentBuildConfigurations: this,
            });
            this._buildConfigurationsMap.set(buildConfigurationName, buildConfiguration);
        }
        return buildConfiguration;
    }
    async _processTemplate({ buildConfigurationName, jsonBuildConfigurationTemplate, }) {
        try {
            const expandedBuildConfigurationsMap = await this._expandTemplateBuildConfigurations({
                buildConfigurationName,
                jsonBuildConfigurationTemplate,
            });
            for (const [expandedBuildConfigurationName, expandedBuildConfiguration,] of expandedBuildConfigurationsMap) {
                if (this._namesSet.has(expandedBuildConfigurationName)) {
                    throw new ConfigurationError(`duplicate build configuration name ` +
                        `"${expandedBuildConfigurationName}" ` +
                        `could not be generated from template.`);
                }
                else {
                    this._buildConfigurationsMap.set(expandedBuildConfigurationName, expandedBuildConfiguration);
                    this._jsonBuildConfigurationsNamesMap.set(expandedBuildConfigurationName, buildConfigurationName);
                    this._namesSet.add(expandedBuildConfigurationName);
                }
            }
        }
        catch (error) {
            const message = getErrorMessage(error) +
                ` in buildConfiguration "${buildConfigurationName}"`;
            throw new ConfigurationError(message);
        }
    }
    async _expandTemplateBuildConfigurations({ buildConfigurationName, jsonBuildConfigurationTemplate, }) {
        const log = this.log;
        log.trace(`${BuildConfigurations.name}.` +
            `#expandTemplateBuildConfigurations(${buildConfigurationName})`);
        if (!isJsonObject(jsonBuildConfigurationTemplate.matrix)) {
            throw new ConfigurationError(`buildConfiguration "${buildConfigurationName}" ` +
                `matrix is not an object`);
        }
        if (!isJsonObject(jsonBuildConfigurationTemplate.template)) {
            throw new ConfigurationError(`buildConfiguration "${buildConfigurationName}" ` +
                `template is not a JSON object`);
        }
        const expander = new TemplateExpander({
            engine: this.engine,
            substitutionsVariables: this.substitutionsVariables,
            log: this.log,
        });
        return await expander.expandTemplate({
            templateName: buildConfigurationName,
            matrix: jsonBuildConfigurationTemplate.matrix,
            templateContent: jsonBuildConfigurationTemplate.template,
            templateType: 'buildConfiguration',
            instanceFactory: (expandedName, combination, templateContent, originalTemplateName) => new BuildConfiguration({
                buildConfigurationName: expandedName,
                templateBuildConfigurationName: originalTemplateName,
                jsonBuildConfiguration: templateContent,
                parentBuildConfigurations: this,
                matrixParameters: { ...combination },
            }),
        });
    }
}
export class BuildConfiguration {
    name;
    templateName;
    parentBuildConfigurations;
    inheritsNames = [];
    isHidden;
    properties = {};
    dependencies = {};
    devDependencies = {};
    jsonBuildConfiguration;
    isTemplate;
    _log;
    _substitutionsVariables;
    matrixParameters;
    _actions;
    _buildFolderRelativePath;
    _inheritedNamesSet = new Set();
    _isInitialised = false;
    constructor({ buildConfigurationName, templateBuildConfigurationName, jsonBuildConfiguration, parentBuildConfigurations, matrixParameters, }) {
        assert(buildConfigurationName, 'buildConfigurationName is required');
        assert(jsonBuildConfiguration, 'jsonBuildConfiguration is required');
        assert(parentBuildConfigurations, 'parentBuildConfigurations is required');
        const log = parentBuildConfigurations.log;
        this._log = log;
        log.trace(`${BuildConfiguration.name}(${buildConfigurationName})`);
        this.name = buildConfigurationName;
        this.jsonBuildConfiguration = jsonBuildConfiguration;
        this.parentBuildConfigurations = parentBuildConfigurations;
        if (matrixParameters !== undefined) {
            this.matrixParameters = matrixParameters;
        }
        if (templateBuildConfigurationName !== undefined) {
            this.templateName = templateBuildConfigurationName;
        }
        this._substitutionsVariables = {
            ...this.parentBuildConfigurations.substitutionsVariables,
        };
        this.isHidden = this.jsonBuildConfiguration.hidden ?? false;
        this.isTemplate = this.templateName !== undefined;
    }
    async initialise() {
        const log = this._log;
        log.trace(`${BuildConfiguration.name}.initialise()` + ` @${this.name}`);
        if (this._isInitialised) {
            log.trace(`${BuildConfiguration.name}.initialise()` + ` @${this.name} again`);
            return false;
        }
        log.trace(`${BuildConfiguration.name}.initialise()` + ` @${this.name}`);
        let localJsonBuildConfiguration;
        if (this.isTemplate) {
            localJsonBuildConfiguration = await this._substituteTemplate();
        }
        else {
            localJsonBuildConfiguration = await this._substituteInherits();
        }
        const inheritedActionsMap = await this._processInherits(localJsonBuildConfiguration);
        this.properties = {
            ...this.properties,
            ...localJsonBuildConfiguration.properties,
        };
        assert(this.name, 'buildConfigurationName missing');
        this._substitutionsVariables = {
            ...this.parentBuildConfigurations.substitutionsVariables,
            properties: {
                ...this._substitutionsVariables.properties,
                ...this.properties,
            },
            matrix: this.matrixParameters ?? {},
            configuration: {
                ...localJsonBuildConfiguration,
                name: this.name,
            },
        };
        if (!this.isHidden) {
            this._buildFolderRelativePath = await this._getBuildFolderRelativePath();
            const properties = this._substitutionsVariables.properties;
            properties.buildFolderRelativePath = this._buildFolderRelativePath;
        }
        this.dependencies = {
            ...this.dependencies,
            ...localJsonBuildConfiguration.dependencies,
        };
        this.devDependencies = {
            ...this.devDependencies,
            ...localJsonBuildConfiguration.devDependencies,
        };
        const unsubstitutedDependencies = {
            dependencies: this.dependencies,
            devDependencies: this.devDependencies,
        };
        const stringifiedDependencies = JSON.stringify(unsubstitutedDependencies);
        if (hasLiquidSyntax(stringifiedDependencies)) {
            let substitutedDependencies;
            try {
                substitutedDependencies = await performSubstitutions({
                    log,
                    engine: this.parentBuildConfigurations.engine,
                    input: stringifiedDependencies,
                    substitutionsVariables: this._substitutionsVariables,
                });
            }
            catch (error) {
                const message = getErrorMessage(error) +
                    ` in buildConfiguration "${this.name}" dependencies`;
                throw new ConfigurationError(message);
            }
            const parsedDependencies = JSON.parse(substitutedDependencies);
            this.dependencies = parsedDependencies.dependencies ?? {};
            this.devDependencies = parsedDependencies.devDependencies ?? {};
        }
        this._actions = new Actions({
            log: this._log,
            engine: this.parentBuildConfigurations.engine,
            substitutionsVariables: this._substitutionsVariables,
            inheritedActionsMap,
            jsonActions: localJsonBuildConfiguration.actions,
            buildConfiguration: this,
        });
        log.trace(`${BuildConfiguration.name}.initialise() `, `@{this.buildConfigurationName}`);
        if (!this.isHidden) {
            log.trace(this.name, 'buildFolderRelativePath =>', this._buildFolderRelativePath);
        }
        log.trace(this.name, 'properties => ', this.properties);
        log.trace(this.name, 'dependencies => ', this.dependencies);
        log.trace(this.name, 'devDependencies => ', this.devDependencies);
        this._isInitialised = true;
        return true;
    }
    get actions() {
        assert(this._isInitialised, 'BuildConfiguration must be initialised before ' + 'accessing actions');
        assert(this._actions !== undefined, 'Actions not initialised');
        return this._actions;
    }
    get buildFolderRelativePath() {
        assert(this._isInitialised, 'BuildConfiguration must be initialised before ' +
            'accessing buildFolderRelativePath');
        assert(this._buildFolderRelativePath !== undefined, 'BuildConfiguration _buildFolderRelativePath not initialised');
        return this._buildFolderRelativePath;
    }
    async _substituteTemplate() {
        const log = this._log;
        let localJsonBuildConfiguration;
        const stringifiedJsonBuildConfiguration = JSON.stringify(this.jsonBuildConfiguration);
        if (hasLiquidSyntax(stringifiedJsonBuildConfiguration)) {
            let substitutedJsonBuildConfiguration;
            try {
                substitutedJsonBuildConfiguration = await performSubstitutions({
                    log,
                    engine: this.parentBuildConfigurations.engine,
                    input: stringifiedJsonBuildConfiguration,
                    substitutionsVariables: {
                        ...this._substitutionsVariables,
                        matrix: this.matrixParameters ?? {},
                        configuration: {
                            ...this.jsonBuildConfiguration,
                            name: this.name,
                        },
                    },
                });
            }
            catch (error) {
                const message = getErrorMessage(error) + ` in buildConfiguration "${this.name}"`;
                throw new ConfigurationError(message);
            }
            localJsonBuildConfiguration = JSON.parse(substitutedJsonBuildConfiguration);
        }
        else {
            localJsonBuildConfiguration = this.jsonBuildConfiguration;
        }
        return localJsonBuildConfiguration;
    }
    async _substituteInherits() {
        const log = this._log;
        let localJsonBuildConfiguration;
        const stringifiedJsonInherits = JSON.stringify(this.jsonBuildConfiguration.inherits ?? {});
        if (hasLiquidSyntax(stringifiedJsonInherits)) {
            let substitutedJsonInherits;
            try {
                substitutedJsonInherits = await performSubstitutions({
                    log,
                    engine: this.parentBuildConfigurations.engine,
                    input: stringifiedJsonInherits,
                    substitutionsVariables: {
                        ...this._substitutionsVariables,
                        configuration: {
                            ...this.jsonBuildConfiguration,
                            name: this.name,
                        },
                    },
                });
            }
            catch (error) {
                const message = getErrorMessage(error) +
                    ` in buildConfiguration "${this.name}" inherits`;
                throw new ConfigurationError(message);
            }
            localJsonBuildConfiguration = {
                ...this.jsonBuildConfiguration,
                inherits: JSON.parse(substitutedJsonInherits),
            };
        }
        else {
            localJsonBuildConfiguration = this.jsonBuildConfiguration;
        }
        return localJsonBuildConfiguration;
    }
    _parseInheritsField(localJsonBuildConfiguration) {
        let jsonInherits = [];
        if (isString(localJsonBuildConfiguration.inherits)) {
            jsonInherits = [localJsonBuildConfiguration.inherits];
        }
        else if (Array.isArray(localJsonBuildConfiguration.inherits)) {
            jsonInherits = localJsonBuildConfiguration.inherits;
        }
        else if (isString(localJsonBuildConfiguration.inherit)) {
            jsonInherits = [localJsonBuildConfiguration.inherit];
        }
        else if (Array.isArray(localJsonBuildConfiguration.inherit)) {
            jsonInherits = localJsonBuildConfiguration.inherit;
        }
        if (jsonInherits.length > 0) {
            const joinedInherits = jsonInherits.join(os.EOL);
            return joinedInherits.split(os.EOL);
        }
        return jsonInherits;
    }
    async _processInheritedConfiguration(inheritedBuildConfigurationName, inheritedActionsMap) {
        if (inheritedBuildConfigurationName.trim() === '') {
            return;
        }
        if (!this.parentBuildConfigurations.hasJson(inheritedBuildConfigurationName)) {
            throw new ConfigurationError(`buildConfiguration "${this.name}" ` +
                `inherits from missing "${inheritedBuildConfigurationName}"`);
        }
        if (this._inheritedNamesSet.has(inheritedBuildConfigurationName)) {
            throw new ConfigurationError(`buildConfiguration "${this.name}" ` +
                `inherits from circular reference ` +
                `"${inheritedBuildConfigurationName}"`);
        }
        this._inheritedNamesSet.add(inheritedBuildConfigurationName);
        const inheritedBuildConfiguration = this.parentBuildConfigurations.get(inheritedBuildConfigurationName);
        await inheritedBuildConfiguration.initialise();
        this.properties = {
            ...this.properties,
            ...inheritedBuildConfiguration.properties,
        };
        this.dependencies = {
            ...this.dependencies,
            ...inheritedBuildConfiguration.dependencies,
        };
        this.devDependencies = {
            ...this.devDependencies,
            ...inheritedBuildConfiguration.devDependencies,
        };
        await inheritedBuildConfiguration.actions.initialise();
        for (const actionName of inheritedBuildConfiguration.actions.names) {
            const action = inheritedBuildConfiguration.actions.get(actionName);
            inheritedActionsMap.set(actionName, action);
        }
    }
    async _processInherits(localJsonBuildConfiguration) {
        const log = this._log;
        const inheritsNames = this._parseInheritsField(localJsonBuildConfiguration);
        this.inheritsNames = inheritsNames;
        log.trace(this.name, 'inherits from', this.inheritsNames);
        const inheritedActionsMap = new Map();
        for (const inheritedBuildConfigurationName of inheritsNames) {
            await this._processInheritedConfiguration(inheritedBuildConfigurationName, inheritedActionsMap);
        }
        return inheritedActionsMap;
    }
    async _getBuildFolderRelativePath() {
        const log = this._log;
        let folderPath;
        if (buildFolderRelativePathPropertyName in
            this._substitutionsVariables.properties) {
            folderPath = this._substitutionsVariables.properties[buildFolderRelativePathPropertyName];
            if (folderPath !== '') {
                try {
                    const substitutedFolderPath = await performSubstitutions({
                        log,
                        engine: this.parentBuildConfigurations.engine,
                        input: folderPath,
                        substitutionsVariables: this._substitutionsVariables,
                    });
                    return substitutedFolderPath;
                }
                catch (error) {
                    const message = getErrorMessage(error) + ` in buildConfiguration "${this.name}"`;
                    throw new ConfigurationError(message);
                }
            }
        }
        const defaultFolderPath = path.join('build', filterPath(this.name));
        return defaultFolderPath;
    }
}
//# sourceMappingURL=build-configurations.js.map