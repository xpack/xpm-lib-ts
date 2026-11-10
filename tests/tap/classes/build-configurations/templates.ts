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
// import * as path from 'node:path'
// import assert, { AssertionError } from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import t from 'tap'

// import { Logger } from '@xpack/logger'

// ----------------------------------------------------------------------------

import * as xpm from '../../../../src/index.js'
import { log, testIdempotentInitialisation } from '../../../helpers/index.js'

// ============================================================================

const engine = new xpm.LiquidEngine()
// const log = new Logger({ level: 'info' })

await t.test('BuildConfigurations - templates', async (t): Promise<void> => {
  const jsonBuildConfigurations: xpm.JsonBuildConfigurations = {
    configOne: {
      properties: {
        p1: 'v1',
      },
    },
    'configTwo-{{ matrix.alfa }}-{{ matrix.beta }}': {
      matrix: {
        alfa: ['a1', 'a2'],
        beta: ['b1', 'b2'],
      },
      template: {
        hidden: true,
        properties: {
          p2: 'v{{ matrix.alfa }}.{{ matrix.beta }}',
        },
      },
    },
    configThree: {
      properties: {
        p3: 'v3',
      },
    },
    'configFour-{{ matrix.gamma }}-{{ matrix.delta }}': {
      matrix: {
        gamma: ['a1', 'a2'],
        delta: ['b1', 'b2'],
      },
      template: {
        inherits: 'configTwo-{{ matrix.gamma }}-{{ matrix.delta }}',
        properties: {
          p4: 'v{{ matrix.gamma }}.{{ matrix.delta }}',
        },
      },
    },
    'configFive-{{ matrix.epsilon }}': {
      matrix: {
        epsilon: ['a1', 'a2'],
      },
      template: {
        // No substitutions.
        properties: {
          p4: 'v4',
        },
      },
    },
    'configSix-{{ matrix.zeta }}': {
      matrix: {
        zeta: ['a1', 'a2'],
      },
      template: {
        properties: {
          p4: '{{ undefined }}',
        },
      },
    },
  }

  const buildConfigurations = new xpm.BuildConfigurations({
    log,
    engine,
    substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
    jsonBuildConfigurations,
  })

  await buildConfigurations.initialise()
  t.equal(buildConfigurations.size, 14, 'size 14')

  const configNames = buildConfigurations.names
  t.equal(configNames[0], 'configOne', 'configNames[0] is configOne')

  t.equal(
    configNames[1],
    'configTwo-a1-b1',
    'configNames[1] is configTwo-a1-b1'
  )
  t.equal(
    configNames[2],
    'configTwo-a1-b2',
    'configNames[2] is configTwo-a1-b2'
  )
  t.equal(
    configNames[3],
    'configTwo-a2-b1',
    'configNames[3] is configTwo-a2-b1'
  )
  t.equal(
    configNames[4],
    'configTwo-a2-b2',
    'configNames[4] is configTwo-a2-b2'
  )

  t.equal(
    buildConfigurations.isHidden('configTwo-a1-b1'),
    true,
    'isHidden(configTwo-a1-b1) is true'
  )

  t.equal(
    buildConfigurations.isHidden('configFour-a2-b2'),
    false,
    'isHidden(configFour-a2-b2) is false'
  )

  const configTwoA1B1 = buildConfigurations.get('configTwo-a1-b1')
  await configTwoA1B1.initialise()
  t.equal(
    configTwoA1B1.properties.p2,
    'va1.b1',
    'configTwo-a1-b1 properties.p2 is va1.b1'
  )
  t.equal(configTwoA1B1.isHidden, true, 'configTwo-a1-b1 isHidden is true')

  const configTwoA2B2 = buildConfigurations.get('configTwo-a2-b2')
  await configTwoA2B2.initialise()
  t.equal(
    configTwoA2B2.properties.p2,
    'va2.b2',
    'configTwo-a2-b2 properties.p2 is va2.b2'
  )
  t.equal(configTwoA2B2.isHidden, true, 'configTwo-a2-b2 isHidden is true')

  const configFourA1B2 = buildConfigurations.get('configFour-a1-b2')
  await configFourA1B2.initialise()
  t.equal(
    configFourA1B2.properties.p2,
    'va1.b2',
    'configFour-a1-b2 inherited properties.p2 is va1.b2'
  )
  t.equal(
    configFourA1B2.properties.p4,
    'va1.b2',
    'configFour-a1-b2 own properties.p4 is va1.b2'
  )
  t.equal(configFourA1B2.isHidden, false, 'configFour-a1-b2 isHidden is false')

  const configFiveA1 = buildConfigurations.get('configFive-a1')
  await configFiveA1.initialise()
  t.equal(configFiveA1.properties.p4, 'v4', 'configFive-a1 properties.p4 is v4')

  const configSixA1 = buildConfigurations.get('configSix-a1')
  await t.rejects(
    () => configSixA1.initialise(),
    {
      constructor: xpm.ConfigurationError,
      message: /undefined variable/,
    },
    'throws xpm.ConfigurationError with "undefined variable"'
  )
})

await t.test(
  'BuildConfigurations templates matrix',
  async (t): Promise<void> => {
    const substitutionsVariables = {
      ...xpm.liquidSubstitutionsVariablesBase,
      properties: {
        alfa2: 'a2',
      },
    }

    const jsonBuildConfigurations: xpm.JsonBuildConfigurations = {
      configOne: {
        properties: {
          p1: 'v1',
        },
      },
      'configTwo-{{ matrix.alfa }}-{{ matrix.beta }}': {
        matrix: {
          alfa: ['a1', '{{ properties.alfa2 }}'],
          beta: ['b1', 'b2'],
        },
        template: {
          properties: {
            p2: 'v{{ matrix.alfa }}.{{ matrix.beta }}',
          },
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
    t.equal(buildConfigurations.size, 5, 'size 5')

    const configNames = buildConfigurations.names
    t.equal(configNames[0], 'configOne', 'configNames[0] is configOne')

    t.equal(
      configNames[1],
      'configTwo-a1-b1',
      'configNames[1] is configTwo-a1-b1'
    )
    t.equal(
      configNames[2],
      'configTwo-a1-b2',
      'configNames[2] is configTwo-a1-b2'
    )
  }
)

await t.test(
  'BuildConfigurations - configurations template',
  async (t): Promise<void> => {
    const json: xpm.JsonXpmPackage = {
      name: 'test',
      version: '1.2.3',
      xpack: {
        properties: {
          dummyMap: {
            one: '11',
            two: '22',
            three: '33',
          },
          builders: ['cmake', 'meson'],
          'native-gcc-releases': {
            '15': {
              specifier: '15.2.0-1.1',
              platforms: 'linux-x64,linux-arm64,win32-x64',
            },
            '14': {
              specifier: '14.3.0-1.1',
              platforms: 'linux-x64,linux-arm64,win32-x64',
            },
          },
          'native-gcc-versions': [
            '{{ properties.native-gcc-releases | keys | join_lines }}',
          ],
        },
        actions: {
          dummy: '{{ properties.dummyMap["one"] }}',
        },
        buildConfigurations: {
          alfa: {},
          'native-gcc{{ matrix.native-gcc-version}}-dependencies': {
            matrix: {
              'native-gcc-version': [
                '',
                '{{ properties.native-gcc-versions | join_lines }}',
              ],
            },
            template: {
              hidden: true,
              devDependencies: {
                '@xpack-dev-tools/gcc': {
                  specifier:
                    '{{ properties.native-gcc-releases[matrix.native-gcc-version].specifier }}',
                  platforms:
                    '{{ properties.native-gcc-releases[matrix.native-gcc-version].platforms }}',
                },
              },
            },
          },
          'native-actions': {
            hidden: true,
            actions: {
              install: ['xpm install --config {{ configuration.name }}'],
              'link-dependencies': [
                'xpm link --config {{ configuration.name }} @micro-os-plus/architecture-synthetic-posix',
              ],
            },
          },
          'native-dependencies': {
            hidden: true,
            devDependencies: {
              '@micro-os-plus/architecture-synthetic-posix': '4.0.3',
            },
          },
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
          'native-meson-gcc': {
            hidden: true,
            inherits: [
              'native-actions',
              'meson-native-actions',
              'native-dependencies',
            ],
            properties: {
              buildType: 'debug',
              platformName: 'native',
              toolchainFileName: 'gcc-{{ os.platform }}.ini',
            },
          },
          'meson-native-actions': {
            hidden: true,
            actions: {
              prepare: '{{ properties.commandMesonPrepareWithToolchain }}',
              build: [
                '{{ properties.commandMesonReconfigure }}',
                '{{ properties.commandMesonBuild }}',
              ],
              test: '{{ properties.commandMesonPerformTests }}',
              clean: '{{ properties.commandMesonClean }}',
            },
          },
          'native-{{ matrix.builder }}-gcc{{ matrix.native-gcc-version }}-debug':
            {
              matrix: {
                builder: ['{{ properties.builders | join_lines }}'],
                'native-gcc-version': [
                  '',
                  '{{ properties.native-gcc-versions | join_lines }}',
                ],
              },
              template: {
                inherits: [
                  'native-{{ matrix.builder }}-gcc',
                  'native-gcc{{ matrix.native-gcc-version }}-dependencies',
                ],
              },
            },
          'native-{{ matrix.builder }}-gcc{{ matrix.native-gcc-version }}-release':
            {
              matrix: {
                builder: ['{{ properties.builders | join_lines }}'],
                'native-gcc-version': [
                  '',
                  '{{ properties.native-gcc-versions | join_lines }}',
                ],
              },
              template: {
                inherits: [
                  'native-{{ matrix.builder }}-gcc{{ matrix.native-gcc-version }}-debug',
                ],
                properties: {
                  buildType:
                    "{% case matrix.builder %}{% when 'cmake' %}Release{% when 'meson' %}release{% else %}unknown{% endcase %}",
                },
              },
            },
          bravo: {},
        },
      },
    }

    // log.level = 'trace'
    const xpmDataModel = new xpm.DataModel({
      log,
      jsonPackage: json,
    })

    // -----
    const actions = xpmDataModel.actions
    t.ok(actions, 'has actions')

    await testIdempotentInitialisation(t, actions, 'actions')

    const actionsNames = actions.names
    t.equal(
      actionsNames.length,
      1,
      'actions has ' + actionsNames.length + ' names'
    )

    const action = await actions.get('dummy')
    t.ok(action, 'actions.get("dummy")')

    await action.initialise()
    const commands = action.commands
    t.equal(commands.length, 1, 'action "dummy" has 1 command')
    t.equal(commands[0], '11', 'command is as expected')

    // -----

    const buildConfigurations = xpmDataModel.buildConfigurations
    t.ok(buildConfigurations, 'has buildConfigurations')

    // -----
    await testIdempotentInitialisation(
      t,
      buildConfigurations,
      'buildConfigurations'
    )

    const buildConfigurationsNames = buildConfigurations.names
    // console.log(buildConfigurationsNames)
    t.equal(
      buildConfigurationsNames.length,
      23,
      'buildConfigurations has ' + 23 + ' names'
    )

    t.equal(
      buildConfigurationsNames[0],
      'alfa',
      'buildConfigurations names[0] is "alfa"'
    )
    t.equal(
      buildConfigurationsNames[2],
      'native-gcc14-dependencies',
      'buildConfigurations names[2] is "native-gcc14-dependencies"'
    )
    t.equal(
      buildConfigurationsNames[3],
      'native-gcc15-dependencies',
      'buildConfigurations names[3] is "native-gcc15-dependencies"'
    )
    t.equal(
      buildConfigurationsNames[11],
      'native-cmake-gcc14-debug',
      'buildConfigurations names[11] is "native-cmake-gcc14-debug"'
    )
    t.equal(
      buildConfigurationsNames[21],
      'native-meson-gcc15-release',
      'buildConfigurations names[21] is "native-meson-gcc15-release"'
    )
    t.equal(
      buildConfigurationsNames[22],
      'bravo',
      'buildConfigurations names[22] is "bravo"'
    )

    await t.test(
      'BuildConfigurations - configurations template native-gcc15-dependencies',
      async (t): Promise<void> => {
        const buildConfiguration = buildConfigurations.get(
          'native-gcc15-dependencies'
        )
        t.ok(
          buildConfiguration,
          'buildConfigurationsNames.get("native-gcc15-dependencies")'
        )

        await buildConfiguration.initialise()
        const devDepGcc = buildConfiguration.devDependencies
        t.equal(
          (devDepGcc['@xpack-dev-tools/gcc'] as xpm.JsonDependencyExtended)
            .specifier,
          '15.2.0-1.1',
          'gcc specifier is "15.2.0-1.1"'
        )
        t.equal(
          (devDepGcc['@xpack-dev-tools/gcc'] as xpm.JsonDependencyExtended)
            .platforms,
          'linux-x64,linux-arm64,win32-x64',
          'gcc platforms is "linux-x64,linux-arm64,win32-x64"'
        )
      }
    )

    await t.test(
      'BuildConfigurations - configurations template native-cmake-gcc15-release',
      async (t): Promise<void> => {
        const buildConfiguration = buildConfigurations.get(
          'native-cmake-gcc15-release'
        )
        t.ok(
          buildConfiguration,
          'buildConfigurationsNames.get("native-cmake-gcc15-release")'
        )

        await buildConfiguration.initialise()

        const actions = buildConfiguration.actions
        t.ok(actions, 'has actions')

        await testIdempotentInitialisation(t, actions, 'actions')

        const actionsNames = actions.names
        // console.log(actionsNames)
        t.equal(actionsNames.length, 6, 'actions has ' + 6 + ' names')

        const devDependencies = buildConfiguration.devDependencies
        t.equal(
          (
            devDependencies[
              '@xpack-dev-tools/gcc'
            ] as xpm.JsonDependencyExtended
          ).specifier,
          '15.2.0-1.1',
          'gcc specifier is "15.2.0-1.1"'
        )
        t.equal(
          (
            devDependencies[
              '@xpack-dev-tools/gcc'
            ] as xpm.JsonDependencyExtended
          ).platforms,
          'linux-x64,linux-arm64,win32-x64',
          'gcc platforms is "linux-x64,linux-arm64,win32-x64"'
        )
        t.equal(
          devDependencies['@micro-os-plus/architecture-synthetic-posix'],
          '4.0.3',
          'architecture-synthetic-posix specifier is "4.0.3"'
        )
      }
    )
  }
)
