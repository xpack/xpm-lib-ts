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

// ----------------------------------------------------------------------------

// import * as os from 'node:os'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import t from 'tap'


// ----------------------------------------------------------------------------

import * as xpm from '../../../../src/index.js'
import { log, testIdempotentInitialisation } from '../../../helpers/index.js'

// ============================================================================

const engine = new xpm.LiquidEngine()
// const log = new Logger({ level: 'info' })

// ----------------------------------------------------------------------------

await t.test('BuildConfigurations - inheritance', async (t): Promise<void> => {
  const substitutionsVariables = {
    ...xpm.liquidSubstitutionsVariablesBase,
    properties: {
      package3version: '3.2.1',
      inherits: 'configOne',
    },
  }

  const jsonBuildConfigurations: xpm.JsonBuildConfigurations = {
    configOne: {
      inherits: ' ',
      properties: {
        p1: 'v1.1',
        p2: 'v1.2',
        p3: 'v1.3',
      },
      actions: {
        buildOne: 'echo Build One action',
      },
    },
    configTwo: {
      inherits: 'configOne',
      properties: {
        p2: 'v2.2',
        p3: 'v2.3',
        p4: 'v2.4',
      },
      actions: {
        buildTwo: 'echo Build Two action',
      },
      dependencies: {
        package2a: '^1.0.0',
      },
      devDependencies: {
        package2b: '^2.0.0',
      },
    },
    configThree: {
      inherits: ['configTwo'],
      properties: {
        p3: 'v3.3',
        p4: 'v3.4',
      },
      actions: {
        buildThree: 'echo Build Three action',
      },
      dependencies: {
        package3a: '^{{ properties.package3version }}',
      },
      devDependencies: {
        package3b: '^2.0.0',
      },
    },
    configFour: {
      inherits: ['unknownConfig'],
    },
    configFive: {
      inherit: 'configSix',
    },
    configSix: {
      inherit: ['configFive'],
    },
    configSeven: {
      inherits: '{{properties.inherits}}',
    },
    configEight: {
      inherits: '{{undefined}}',
    },
    configNine: {
      dependencies: {
        package9a: '^{{ properties.package3version }}',
      },
    },
    configTen: {
      devDependencies: {
        package10a: '^{{ properties.package3version }}',
      },
    },
  }

  const buildConfigurations = new xpm.BuildConfigurations({
    log,
    engine,
    substitutionsVariables,
    jsonBuildConfigurations,
  })

  await buildConfigurations.initialise()
  t.equal(buildConfigurations.size, 10, 'size 10')

  const configThree = buildConfigurations.get('configThree')
  await configThree.initialise()

  t.equal(configThree.properties.p1, 'v1.1', 'inherited properties.p1 is v1.1')
  t.equal(configThree.properties.p2, 'v2.2', 'inherited properties.p2 is v2.2')
  t.equal(configThree.properties.p3, 'v3.3', 'own properties.p3 is v3.3')
  t.equal(configThree.properties.p4, 'v3.4', 'own properties.p4 is v3.4')

  const actionsThree = configThree.actions
  await actionsThree.initialise()
  t.equal(actionsThree.size, 3, 'actionsThree size 3')
  const actionBuildThree = actionsThree.get('buildThree')
  await actionBuildThree.initialise()
  t.equal(actionBuildThree.commands.length, 1, 'actionBuildThree has 1 command')
  t.equal(
    actionBuildThree.commands[0],
    'echo Build Three action',
    'actionBuildThree command is correct'
  )

  t.equal(
    configThree.dependencies['package2a'],
    '^1.0.0',
    'inherited dependencies package2a'
  )
  t.equal(
    configThree.dependencies['package3a'],
    '^3.2.1',
    'own dependencies package3a'
  )
  t.equal(
    configThree.devDependencies['package2b'],
    '^2.0.0',
    'inherited devDependencies package2b'
  )
  t.equal(
    configThree.devDependencies['package3b'],
    '^2.0.0',
    'own devDependencies package3b'
  )

  const configTwo = buildConfigurations.get('configTwo')
  let isInitialised = await configTwo.initialise()
  // It was initialised while processing configOne inheritance.
  t.equal(isInitialised, false, 'configTwo initialise() again => false')

  t.equal(configTwo.properties.p1, 'v1.1', 'inherited properties.p1 is v1.1')
  t.equal(configTwo.properties.p2, 'v2.2', 'own properties.p2 is v2.2')
  t.equal(configTwo.properties.p3, 'v2.3', 'own properties.p3 is v2.3')
  t.equal(configTwo.properties.p4, 'v2.4', 'own properties.p4 is v2.4')

  t.equal(
    configTwo.dependencies['package2a'],
    '^1.0.0',
    'own dependencies package2a'
  )
  t.equal(
    configTwo.devDependencies['package2b'],
    '^2.0.0',
    'own devDependencies package2b'
  )

  const actionsTwo = configTwo.actions
  await actionsTwo.initialise()
  t.equal(actionsTwo.size, 2, 'actionsTwo size 2')
  const actionBuildTwo = actionsTwo.get('buildTwo')
  await actionBuildTwo.initialise()
  t.equal(actionBuildTwo.commands.length, 1, 'actionBuildTwo has 1 command')
  t.equal(
    actionBuildTwo.commands[0],
    'echo Build Two action',
    'actionBuildTwo command is correct'
  )

  const configFour = buildConfigurations.get('configFour')
  await t.rejects(
    async () => await configFour.initialise(),
    {
      constructor: xpm.ConfigurationError,
      message: /inherits from missing/,
    },
    'throws ConfigurationError for inheriting from missing configuration'
  )

  const configFive = buildConfigurations.get('configFive')
  await t.rejects(
    async () => await configFive.initialise(),
    {
      constructor: xpm.ConfigurationError,
      message: /circular reference/,
    },
    'throws ConfigurationError for circular reference in inheritance'
  )

  const configSeven = buildConfigurations.get('configSeven')
  await configSeven.initialise()

  t.equal(configSeven.properties.p1, 'v1.1', 'inherited properties.p1 is v1.1')

  const configEight = buildConfigurations.get('configEight')
  await t.rejects(
    async () => await configEight.initialise(),
    {
      constructor: xpm.ConfigurationError,
      message: /undefined variable/,
    },
    'throws ConfigurationError for undefined variable in templates'
  )

  const configNine = buildConfigurations.get('configNine')
  await configNine.initialise()
  t.equal(
    configNine.dependencies['package9a'],
    '^3.2.1',
    'dependencies package9a'
  )

  const configTen = buildConfigurations.get('configTen')
  await configTen.initialise()
  t.equal(
    configTen.devDependencies['package10a'],
    '^3.2.1',
    'devDependencies package10a'
  )
})

await t.test(
  'BuildConfigurations - configurations inheritance',
  async (t): Promise<void> => {
    const json: xpm.JsonXpmPackage = {
      name: 'test',
      version: '1.2.3',
      xpack: {
        properties: {
          buildFolderRelativePath:
            "{{ 'build' | path_join: configuration.name | to_filename | downcase }}",
          buildFolderRelativePathPosix:
            "{{ 'build' | path_posix_join: configuration.name | downcase }}",
          commandCMakePrepare:
            '{{ properties.commandCMakeReconfigure }} --log-level=VERBOSE',
          commandCMakePrepareWithToolchain:
            '{{ properties.commandCMakePrepare }} -D CMAKE_TOOLCHAIN_FILE=xpacks/@micro-os-plus/build-helper/cmake/toolchains/{{ properties.toolchainFileName }}',
          commandCMakeReconfigure:
            "cmake -S . -B {{ properties.buildFolderRelativePathPosix }} -G Ninja{% if os.platform == 'win32' %} -D CMAKE_MAKE_PROGRAM=ninja.cmd{% endif %} -D CMAKE_BUILD_TYPE={{ properties.buildType }} -D PLATFORM_NAME={{ properties.platformName }} -D CMAKE_EXPORT_COMPILE_COMMANDS=ON",
          commandCMakeBuild:
            'cmake --build {{ properties.buildFolderRelativePathPosix }}',
          commandCMakeBuildVerbose:
            'cmake --build {{ properties.buildFolderRelativePathPosix }} --verbose',
          commandCMakeClean:
            'cmake --build {{ properties.buildFolderRelativePathPosix }} --target clean',
          commandCMakePerformTests:
            'cd {{ properties.buildFolderRelativePath }} && ctest -V',
        },
        buildConfigurations: {
          'cmake-actions': {
            hidden: true,
            actions: {
              prepare: '{{ properties.commandCMakePrepareWithToolchain }}',
              build: [
                '{{ properties.commandCMakeReconfigure }}',
                '{{ properties.commandCMakeBuild }}',
              ],
              test: '{{ properties.commandCMakePerformTests }}',
              clean: '{{ properties.commandCMakeClean }}',
            },
          },
          'native-dependencies': {
            hidden: true,
            devDependencies: {
              '@micro-os-plus/architecture-synthetic-posix': '4.0.3',
            },
          },
          'native-actions': {
            hidden: true,
            actions: {
              install: ['xpm install --config {{ configuration.name }}'],
              'link-deps': [
                'xpm link --config {{ configuration.name }} @micro-os-plus/architecture-synthetic-posix',
              ],
            },
          },
          'gcc14-dependencies': {
            hidden: true,
            $devDependenciesUrl:
              'https://www.npmjs.com/package/@xpack-dev-tools/gcc',
            devDependencies: {
              '@xpack-dev-tools/gcc': {
                specifier: '14.2.0-2.1',
                platforms: 'linux-x64,linux-arm64,win32-x64',
              },
            },
          },
          'native-cmake-gcc': {
            hidden: true,
            inherits: [
              'cmake-actions',
              'native-actions',
              'native-dependencies',
            ],
            properties: {
              buildType: 'Debug',
              platformName: 'native',
              toolchainFileName: 'gcc.cmake',
            },
          },
          'native-cmake-gcc14-debug': {
            inherits: ['native-cmake-gcc', 'gcc14-dependencies'],
          },
          'native-cmake-gcc14-release': {
            inherits: ['native-cmake-gcc14-debug'],
            properties: {
              buildType: 'Release',
            },
          },
        },
      },
    }

    const xpmDataModel = new xpm.DataModel({
      log,
      jsonPackage: json,
    })

    const buildConfigurations = xpmDataModel.buildConfigurations
    t.ok(buildConfigurations, 'has buildConfigurations')

    await testIdempotentInitialisation(
      t,
      buildConfigurations,
      'buildConfigurations'
    )

    const buildConfigurationsNames = buildConfigurations.names
    t.equal(
      buildConfigurationsNames.length,
      Object.keys(json.xpack!.buildConfigurations!).length,
      'buildConfigurations has ' + buildConfigurationsNames.length + ' names'
    )

    t.ok(
      buildConfigurations.has('native-cmake-gcc14-release'),
      'buildConfigurations has configuration "native-cmake-gcc14-release"'
    )

    // log.level = 'trace'
    const buildConfiguration = buildConfigurations.get(
      'native-cmake-gcc14-release'
    )
    // log.level = 'info'
    t.ok(
      buildConfiguration,
      'buildConfigurationsNames.get("native-cmake-gcc14-release")'
    )

    await buildConfiguration.initialise()

    t.equal(
      Object.keys(buildConfiguration.properties).length,
      3,
      'buildConfiguration.properties length is 3'
    )
    t.equal(
      buildConfiguration.properties.buildType,
      'Release',
      'buildConfiguration.properties.buildType'
    )
    t.equal(
      buildConfiguration.properties.platformName,
      'native',
      'buildConfiguration.properties.platformName'
    )
    t.equal(
      buildConfiguration.properties.toolchainFileName,
      'gcc.cmake',
      'buildConfiguration.properties.toolchainFileName'
    )

    t.equal(
      Object.keys(buildConfiguration.devDependencies).length,
      2,
      'devDependencies length matches'
    )

    t.equal(
      buildConfiguration.devDependencies.hasOwnProperty('@xpack-dev-tools/gcc'),
      true,
      'has devDependency @xpack-dev-tools/gcc'
    )
    t.equal(
      buildConfiguration.devDependencies.hasOwnProperty(
        '@micro-os-plus/architecture-synthetic-posix'
      ),
      true,
      'has devDependency @micro-os-plus/architecture-synthetic-posix'
    )

    const actions = buildConfiguration.actions
    t.ok(actions, 'has actions')

    await testIdempotentInitialisation(t, actions, 'actions')

    const actionsNames = actions.names
    // console.log(actionsNames)
    t.equal(
      actionsNames.length,
      6,
      'actions has ' + actionsNames.length + ' names'
    )

    const action = await actions.get('build')
    t.ok(action, 'actions.get("build")')

    await testIdempotentInitialisation(t, action, 'action')
    const commands = action.commands
    t.equal(commands.length, 2, 'action "build" has 2 commands')
    t.match(
      commands[0],
      'cmake -S . -B build/native-cmake-gcc14-release -G Ninja'
    )
    t.equal(
      commands[1],
      'cmake --build build/native-cmake-gcc14-release',
      'second command is cmake --build'
    )

    // -----
  }
)
