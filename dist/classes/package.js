import assert from 'node:assert';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import semver from 'semver';
import { ConfigurationError, InputError, PrerequisitesError } from './errors.js';
import { isString } from '../functions/is-something.js';
import { hasLiquidSyntax } from '../functions/utils.js';
export class Package {
    packageFolderPath;
    jsonPackage;
    _log;
    constructor({ packageFolderPath, log }) {
        assert(packageFolderPath && path.isAbsolute(packageFolderPath), `packageFolderPath must be an absolute path, got: ${packageFolderPath}`);
        this._log = log;
        this.packageFolderPath = packageFolderPath;
        log.trace(`${Package.name}(${packageFolderPath})`);
    }
    async readPackageDotJson({ withThrow = false, } = {}) {
        const jsonFilePath = path.join(this.packageFolderPath, 'package.json');
        let fileContent;
        try {
            fileContent = await fs.readFile(jsonFilePath);
        }
        catch (error) {
            if (withThrow) {
                if (error instanceof Error) {
                    this._log.trace(error.message);
                }
                throw new InputError(`no package.json in folder ‘${this.packageFolderPath}’`);
            }
            else {
                return undefined;
            }
        }
        try {
            this.jsonPackage = JSON.parse(fileContent.toString());
        }
        catch (error) {
            if (withThrow) {
                this.jsonPackage = undefined;
                if (error instanceof Error) {
                    this._log.trace(error.message);
                }
                throw new InputError(`invalid package.json in folder ‘${this.packageFolderPath}’`);
            }
            else {
                return undefined;
            }
        }
        return this.jsonPackage;
    }
    async rewritePackageDotJson(jsonPackage) {
        const log = this._log;
        assert(jsonPackage, 'jsonPackage is required');
        const jsonString = JSON.stringify(jsonPackage, null, 2) + '\n';
        const jsonFilePath = path.join(this.packageFolderPath, 'package.json');
        log.trace(`write filePath: '${jsonFilePath}'`);
        await fs.writeFile(jsonFilePath, jsonString);
    }
    isNpmPackage() {
        const jsonPackage = this.jsonPackage;
        if (!jsonPackage) {
            return false;
        }
        if (jsonPackage.name === undefined || jsonPackage.version === undefined) {
            return false;
        }
        const name = jsonPackage.name.trim();
        if (name.length === 0) {
            return false;
        }
        const version = jsonPackage.version.trim();
        if (version.length === 0) {
            return false;
        }
        return true;
    }
    isXpmPackage() {
        const jsonPackage = this.jsonPackage;
        if (!this.isNpmPackage()) {
            return false;
        }
        if (jsonPackage?.xpack === undefined) {
            return false;
        }
        return true;
    }
    isBinaryXpmPackage() {
        const jsonPackage = this.jsonPackage;
        if (!this.isXpmPackage()) {
            return false;
        }
        if (jsonPackage?.xpack.executables ?? jsonPackage?.xpack.bin) {
            if (!jsonPackage.xpack.binaries) {
                throw new ConfigurationError("doesn't look like a proper binary xpm package, " +
                    'package.json has no "xpack.binaries"');
            }
            if (!jsonPackage.xpack.binaries.platforms) {
                throw new ConfigurationError("doesn't look like a proper binary xpm package, " +
                    'package.json has no "xpack.binaries.platforms"');
            }
            return true;
        }
        if (jsonPackage?.xpack.binaries) {
            if (!jsonPackage.xpack.binaries.platforms) {
                throw new ConfigurationError("doesn't look like a proper binary xpm package, " +
                    'package.json has no "xpack.binaries.platforms"');
            }
            throw new ConfigurationError("doesn't look like a proper binary xpm package, " +
                'package.json has no "xpack.executables"');
        }
        return false;
    }
    isNodeModule() {
        const jsonPackage = this.jsonPackage;
        if (!this.isNpmPackage()) {
            return false;
        }
        if (jsonPackage?.xpack) {
            return false;
        }
        return true;
    }
    isBinaryNodeModule() {
        const jsonPackage = this.jsonPackage;
        if (!this.isNodeModule()) {
            return false;
        }
        if (jsonPackage?.bin === undefined) {
            return false;
        }
        return true;
    }
    hasNpmScripts() {
        const jsonPackage = this.jsonPackage;
        if (jsonPackage?.scripts !== undefined &&
            Object.keys(jsonPackage.scripts).length > 0) {
            return true;
        }
        return false;
    }
    hasXpmActions() {
        const json = this.jsonPackage;
        try {
            if (json?.xpack.actions !== undefined &&
                Object.keys(json.xpack.actions).length > 0) {
                return true;
            }
            if (json?.xpack.buildConfigurations !== undefined &&
                Object.keys(json.xpack.buildConfigurations).length > 0) {
                for (const [buildConfigurationName, buildConfiguration,] of Object.entries(json.xpack.buildConfigurations)) {
                    if (hasLiquidSyntax(buildConfigurationName)) {
                        const buildConfigurationTemplate = buildConfiguration;
                        if (buildConfigurationTemplate.template.actions !== undefined &&
                            Object.keys(buildConfigurationTemplate.template.actions).length >
                                0) {
                            return true;
                        }
                    }
                    else {
                        const buildConfigurationContent = buildConfiguration;
                        if (buildConfigurationContent.actions !== undefined &&
                            Object.keys(buildConfigurationContent.actions).length > 0) {
                            return true;
                        }
                    }
                }
            }
        }
        catch (error) {
        }
        return false;
    }
    getMinimumXpmRequired() {
        const log = this._log;
        const jsonPackage = this.jsonPackage;
        log.trace(`${Package.name}.getMinimumXpmRequired()`);
        const version = jsonPackage?.xpack.minimumXpmRequired;
        if (version === undefined) {
            return undefined;
        }
        if (!isString(version)) {
            return undefined;
        }
        return version.replace(/-.*$/, '');
    }
    async checkMinimumXpmRequired({ xpmRootFolderPath, }) {
        const log = this._log;
        const jsonPackage = this.jsonPackage;
        log.trace(`${Package.name}.checkMinimumXpmRequired()`);
        if (!this.isXpmPackage()) {
            return undefined;
        }
        const minimumXpmRequired = this.getMinimumXpmRequired();
        if (!minimumXpmRequired) {
            log.trace('minimumXpmRequired not used, no checks');
            return undefined;
        }
        log.trace(`minimumXpmRequired: ${minimumXpmRequired}`);
        let jsonXpmCliPackage;
        try {
            const cliXpmPackage = new Package({
                log,
                packageFolderPath: xpmRootFolderPath,
            });
            jsonXpmCliPackage = await cliXpmPackage.readPackageDotJson({
                withThrow: true,
            });
        }
        catch (error) {
            if (error instanceof Error) {
                log.trace(error.message);
            }
            else {
                log.trace(error);
            }
            return undefined;
        }
        assert(jsonXpmCliPackage, 'jsonXpmCliPackage is required');
        log.trace(jsonXpmCliPackage.version);
        if (!jsonXpmCliPackage.version) {
            return undefined;
        }
        const xpmVersion = semver.clean(jsonXpmCliPackage.version.replace(/-.*$/, ''));
        if (!xpmVersion) {
            return undefined;
        }
        if (semver.lt(xpmVersion, minimumXpmRequired)) {
            assert(jsonPackage?.name, 'jsonPackage.name is required');
            throw new PrerequisitesError(`package '${jsonPackage.name}' ` +
                `requires xpm v${minimumXpmRequired} or later, please upgrade`);
        }
        return minimumXpmRequired;
    }
    parsePackageSpecifier({ npmPackageSpecifier, }) {
        assert(npmPackageSpecifier, 'npmPackageSpecifier is required');
        const log = this._log;
        let scope;
        let name;
        let version;
        if (npmPackageSpecifier.startsWith('@')) {
            const arr = npmPackageSpecifier.split('/');
            if (arr.length > 2) {
                throw new InputError(`'${npmPackageSpecifier}' not a package name`);
            }
            let nameAndVersion;
            [scope, nameAndVersion] = arr;
            if (nameAndVersion !== undefined) {
                ;
                [name, version] = nameAndVersion.split('@');
            }
        }
        else {
            ;
            [name, version] = npmPackageSpecifier.split('@');
        }
        log.trace(`${npmPackageSpecifier} => ` +
            `${scope ?? '?'} ${name ?? '?'} ${version ?? '?'}`);
        return { scope, name, version };
    }
}
//# sourceMappingURL=package.js.map