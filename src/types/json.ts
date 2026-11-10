/*
 * This file is part of the xPack project (http://xpack.github.io).
 * Copyright (c) 2021-2026 Liviu Ionescu. All rights reserved.
 *
 * Permission to use, copy, modify, and/or distribute this software
 * for any purpose is hereby granted, under the terms of the MIT license.
 *
 * If a copy of the license was not distributed with this file, it can
 * be obtained from https://opensource.org/license/mit.
 */

// ============================================================================

/**
 * Represents a JSON property value.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonPropertyValue = any

/**
 * Represents a JSON map of properties.
 */
export type JsonProperties = Record<string, JsonPropertyValue>

/**
 * Represents a JSON array of build configuration names to inherit from.
 */
export type JsonBuildConfigurationInherits = string[]

/**
 * Represents a JSON map of npm scripts.
 */
export type JsonScripts = Record<string, string>

/**
 * Represents a JSON map of dependencies.
 */
export type JsonDependencies = Record<string, JsonDependenciesContent>

/**
 * Represents a JSON dependency content as a string or extended definition.
 */
export type JsonDependenciesContent = string | JsonDependencyExtended

/**
 * Represents a JSON extended dependency definition.
 *
 * @remarks
 * Extended dependency format introduced in xpm 0.16.0 to support richer
 * dependency metadata beyond simple version strings. Allows specifying
 * platform constraints and local installation modes.
 *
 * Example usage in `package.json`:
 * ```json
 * "dependencies": {
 *   "@scope/package": {
 *     "specifier": "^1.0.0",
 *     "platforms": ["linux-x64", "darwin-x64"],
 *     "local": "link"
 *   }
 * }
 * ```
 *
 * Platform filtering enables platform-specific dependencies, useful for
 * binary packages that only work on certain operating systems or
 * architectures. Local installation modes control how dependencies are
 * installed in the workspace (symbolic link vs. file copy).
 */
export interface JsonDependencyExtended {
  /**
   * The dependency version specifier.
   */
  specifier: string
  /**
   * The local installation mode, if applicable.
   */
  local?: 'link' | 'copy'
  /**
   * The supported platforms for the dependency.
   */
  platforms?: string | string[]
}

// --------------------------------------------------------------------------

/**
 * Represents a JSON action content as a string or string array.
 */
export type JsonActionContent = string | string[]

/**
 * Represents a JSON template action with a matrix for expansion.
 *
 * @remarks
 * Template actions use matrix parameters to generate multiple action
 * variants from a single definition via Cartesian product expansion. This
 * enables creating platform-specific or configuration-specific actions
 * without duplication.
 *
 * Example usage in `package.json`:
 * ```json
 * "actions": {
 *   "build-{{ matrix.platform }}": {
 *     "matrix": {
 *       "platform": ["linux", "darwin", "win32"]
 *     },
 *     "template": "make build PLATFORM={{ matrix.platform }}"
 *   }
 * }
 * ```
 *
 * This generates three actions: `build-linux`, `build-darwin`, and
 * `build-win32`.
 * Matrix values are accessible in both the action name and template content
 * via `{{ matrix.key }}` Liquid syntax.
 */
export interface JsonActionTemplate {
  /**
   * The matrix of parameters used to generate action variants.
   */
  matrix: JsonTemplateMatrix
  /**
   * The action template content.
   */
  template: JsonActionContent
}

/**
 * Represents a JSON action definition or a template of one.
 */
export type JsonAction = JsonActionContent | JsonActionTemplate

/**
 * Represents a JSON map of action definitions.
 */
export type JsonActions = Record<string, JsonAction>

// --------------------------------------------------------------------------

/**
 * Represents a JSON build configuration definition.
 */
export interface JsonBuildConfigurationContent {
  /**
   * The configurations to inherit from.
   */
  inherits?: JsonBuildConfigurationInherits | string
  /**
   * Deprecated alias of {@link JsonBuildConfigurationContent.inherits}.
   */
  inherit?: JsonBuildConfigurationInherits | string
  /**
   * Whether the configuration should be hidden.
   */
  hidden?: boolean
  /**
   * The properties map for substitutions.
   */
  properties?: JsonProperties
  /**
   * The action definitions for this configuration.
   */
  actions?: JsonActions
  /**
   * The dependencies for this configuration.
   */
  dependencies?: JsonDependencies
  /**
   * The development dependencies for this configuration.
   */
  devDependencies?: JsonDependencies

  /**
   * Allows additional configuration properties.
   */
  [key: string]: JsonPropertyValue
}

/**
 * Represents a JSON template build configuration with matrix expansion.
 *
 * @remarks
 * Template build configurations use matrix parameters to generate multiple
 * configuration variants from a single definition via Cartesian product
 * expansion. Common for cross-compilation scenarios where multiple
 * architecture or platform combinations are needed.
 *
 * Example usage in `package.json`:
 * ```json
 * "buildConfigurations": {
 *   "{{ matrix.os }}-{{ matrix.arch }}": {
 *     "matrix": {
 *       "os": ["linux", "darwin"],
 *       "arch": ["x64", "arm64"]
 *     },
 *     "template": {
 *       "properties": {
 *         "target": "{{ matrix.os }}-{{ matrix.arch }}"
 *       }
 *     }
 *   }
 * }
 * ```
 *
 * This generates four configurations: `linux-x64`, `linux-arm64`,
 * `darwin-x64`, and `darwin-arm64`, each with matrix values available
 * for property substitution.
 */
export interface JsonBuildConfigurationTemplate {
  /**
   * The matrix of parameters used to generate configuration variants.
   */
  matrix: JsonTemplateMatrix
  /**
   * The configuration template content.
   */
  template: JsonBuildConfigurationContent
}

/**
 * Represents a matrix of parameters for template
 * expansion.
 *
 * @remarks
 * The matrix defines parameter arrays used to generate multiple template
 * variants through Cartesian product expansion. Each key
 * represents a parameter name, and its value is an array of possible
 * values for that parameter.
 *
 * Matrix expansion rules:
 *
 * <ul>
 * <li>Each parameter array is combined with all others to create every
 *    possible combination.</li>
 * <li>Matrix values are accessible in template names and template
 *    content via <code>\{\{ matrix.parameterName \}\}</code> Liquid
 *    syntax.</li>
 * <li>The number of generated template variants equals the product of all
 *    array lengths.</li>
 * </ul>
 *
 * Example:
 * ```js
 * {
 *   "os": ["linux", "darwin"],
 *   "arch": ["x64", "arm64"]
 * }
 * ```
 *
 * This generates 4 template variants (2 × 2): `linux-x64`, `linux-arm64`,
 * `darwin-x64`, `darwin-arm64`.
 */
export type JsonTemplateMatrix = Record<string, JsonTemplateMatrixContent>

/**
 * Represents an array of string values for a single matrix parameter.
 *
 * @remarks
 * Each matrix parameter defined in {@link JsonTemplateMatrix} contains an
 * array of string values that will be used during Cartesian product
 * expansion. All values must be strings to ensure consistent template
 * substitution via Liquid syntax.
 *
 * Example for an operating system parameter:
 * ```js
 * ["linux", "darwin", "win32"]
 * ```
 *
 * During template expansion, each value is combined with values from other
 * matrix parameters to generate all possible combinations.
 */
export type JsonTemplateMatrixContent = string[]

/**
 * Represents a JSON build configuration definition or a template of one.
 */
export type JsonBuildConfiguration =
  JsonBuildConfigurationContent | JsonBuildConfigurationTemplate

/**
 * Represents a JSON map of build configuration definitions.
 */
export type JsonBuildConfigurations = Record<string, JsonBuildConfiguration>

// --------------------------------------------------------------------------

/**
 * Represents a JSON xpm-specific section in `package.json`.
 *
 * @remarks
 * The `xpack` section extends standard npm `package.json` with xpm-specific
 * metadata for binary package management, build automation, and
 * cross-platform development workflows.
 *
 * Key capabilities:
 *
 * <ul>
 * <li><b>Binary packages:</b> Define platform-specific binary distributions
 *    with download URLs, checksums, and installation configuration.</li>
 * <li><b>Build configurations:</b> Organize multiple build targets (debug,
 *    release,
 *    platform variants) with inherited properties and dependencies.</li>
 * <li><b>Actions:</b> Define build automation commands that can reference
 *    properties and build configuration context via Liquid templates.</li>
 * <li><b>Properties:</b> User-defined configuration values accessible
 *    throughout the package via template substitution.</li>
 * <li><b>Version requirements:</b> Specify minimum <b>xpm</b> version for
 *    feature compatibility and policy enforcement.</li>
 * </ul>
 *
 * The `xpack` section is optional in npm packages but required for packages
 * using xpm-specific features like build configurations or binary
 * distributions.
 */
export interface JsonXpack {
  /**
   * The minimum required <b>xpm</b> version.
   */
  minimumXpmRequired?: string
  /**
   * The binaries definition, if the package provides binaries.
   */
  binaries?: JsonXpmBinaries
  /**
   * The executables map.
   */
  executables?: Record<string, string>
  /**
   * Deprecated alias of {@link JsonXpack.executables}.
   */
  bin?: Record<string, string> // Deprecated, use executables
  /**
   * The dependencies map.
   */
  dependencies?: JsonDependencies
  /**
   * The development dependencies map.
   */
  devDependencies?: JsonDependencies
  /**
   * The properties map.
   */
  properties?: JsonProperties
  /**
   * The action definitions.
   */
  actions?: JsonActions
  /**
   * The build configurations map.
   */
  buildConfigurations?: JsonBuildConfigurations
}

/**
 * Represents a JSON map of binaries platforms.
 */
export type JsonXpmBinariesPlatforms = Record<string, JsonXpmPlatformFile>

/**
 * Represents a JSON binaries definition in `package.`
 *
 * @remarks
 * Configures binary package distribution for tools, SDKs, or compiled
 * applications. <b>xpm</b> downloads platform-specific archives, verifies
 * their integrity, and extracts them to the specified destination.
 *
 * Example usage in `package.json`:
 * ```json
 * "binaries": {
 *   "destination": ".content",
 *   "baseUrl": "https://github.com/org/repo/releases/download/v1.0.0",
 *   "skip": 1,
 *   "platforms": {
 *     "linux-x64": {
 *       "fileName": "tool-linux-x64.tar.gz",
 *       "sha256": "abc123..."
 *     }
 *   }
 * }
 * ```
 *
 * The skip parameter removes leading path segments from archive entries
 * during extraction, useful for archives with wrapper folders. Checksums
 * ensure downloaded files haven't been corrupted or tampered with.
 */
export interface JsonXpmBinaries {
  /**
   * The destination folder for extracted binaries.
   */
  destination: string
  /**
   * The base URL used to download binaries.
   */
  baseUrl: string
  /**
   * The number of path segments to skip when extracting.
   */
  skip?: number
  /**
   * The platforms map for available binaries.
   */
  platforms: JsonXpmBinariesPlatforms
}

/**
 * Represents a JSON platform-specific binary file definition.
 */
export interface JsonXpmPlatformFile {
  /**
   * The binary archive file name.
   */
  fileName: string
  /**
   * The SHA-256 checksum for integrity verification.
   */
  sha256?: string
  /**
   * The SHA-512 checksum for integrity verification.
   */
  sha512?: string
  /**
   * Optional base URL override for this platform.
   */
  baseUrl?: string
  /**
   * The number of path segments to skip when extracting.
   */
  skip?: number
}

/**
 * Represents a JSON npm `package.json` structure.
 */
export interface JsonNpmPackage {
  /**
   * The package name.
   */
  name?: string
  /**
   * The package version.
   */
  version?: string
  /**
   * The npm scripts map.
   */
  scripts?: JsonScripts
  /**
   * The binary entry points.
   */
  bin?: Record<string, string> | string
  /**
   * The dependencies map.
   */
  dependencies?: JsonDependencies
  /**
   * The development dependencies map.
   */
  devDependencies?: JsonDependencies

  /**
   * Allows additional `package.json` properties.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any // Allow any additional property
}

/**
 * Represents a JSON <b>xpm</b> `package.json` structure.
 *
 * @remarks
 * Combines standard npm `package.json` properties with xpm-specific
 * extensions via the required `xpack` section. All <b>xpm</b> packages are
 * valid npm packages, but not all npm packages are <b>xpm</b> packages.
 *
 * An <b>xpm</b> package can be:
 *
 * <ul>
 * <li><b>A source package:</b> Provides reusable code or resources for other
 *    packages. It contains code, build configurations,
 *    and actions.</li>
 * <li><b>A binary package:</b> Distributes pre-built binaries for multiple
 *    platforms with automated installation.</li>
 * </ul>
 *
 * The presence of the `xpack` section enables <b>xpm</b>-specific features
 * like template-based build configurations, matrix expansion, property
 * substitution, and platform-specific binary distribution. Standard npm
 * fields (name, version, etc.) are used for package
 * identification.
 */
export interface JsonXpmPackage extends JsonNpmPackage {
  /**
   * The xpm-specific configuration section.
   */
  xpack: JsonXpack
}

// --------------------------------------------------------------------------

/**
 * Represents a JSON npm package specifier.
 */
export interface JsonPackageSpecifier {
  /**
   * The package scope, if present.
   */
  scope?: string
  /**
   * The package name.
   */
  name?: string
  /**
   * The version specifier, if present.
   */
  version?: string
}

// ----------------------------------------------------------------------------
