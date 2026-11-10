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
// import { fileURLToPath } from 'node:url'
// import * as path from 'node:path'

// https://www.npmjs.com/package/tap
import t from 'tap'

import { Logger } from '@xpack/logger'

// ----------------------------------------------------------------------------

import * as xpm from '../../../src/index.js'
import { JsonDependencyExtended } from '../../../src/index.js'

// ============================================================================

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)
// const fixturesFolderPath = path.join(path.dirname(__dirname), 'fixtures')

// const log = new Logger({ level: 'info' })

// ----------------------------------------------------------------------------

await t.test('Object substitution', async (t): Promise<void> => {
  const log = new Logger({ level: 'trace' })

  const json: xpm.JsonXpmPackage = {
    name: 'test',
    version: '1.2.3',
    xpack: {
      properties: {
        'native-clang-releases': {
          '21': {
            specifier: '21.1.8-1.1',
            platforms:
              'linux-x64,linux-arm64,win32-x64,darwin-x64,darwin-arm64',
          },
          '20': {
            specifier: '20.1.8-1.1',
            platforms:
              'linux-x64,linux-arm64,win32-x64,darwin-x64,darwin-arm64',
          },
        },
        release: '21',
      },
      buildConfigurations: {
        one: {
          devDependencies: {
            '@xpack-dev-tools/clang': {
              specifier:
                '{{ properties.native-clang-releases[properties.release].specifier }}',
              platforms:
                '{{ properties.native-clang-releases[properties.release].platforms }}',
            },
          },
        },
      },
    },
  }

  const xpmDataModel = new xpm.DataModel({
    log,
    jsonPackage: json,
  })

  xpmDataModel.buildConfigurations.initialise()
  const buildConfig = xpmDataModel.buildConfigurations.get('one')

  await buildConfig.initialise()

  const devDependencies = buildConfig?.devDependencies
  t.ok(devDependencies, 'has devDependencies')

  // console.log(JSON.stringify(devDependencies, null, 2))

  const clangDependency: JsonDependencyExtended = devDependencies[
    '@xpack-dev-tools/clang'
  ] as JsonDependencyExtended
  t.ok(clangDependency, 'has @xpack-dev-tools/clang dependency')

  const specifier = clangDependency.specifier
  t.equal(
    specifier,
    '21.1.8-1.1',
    '@xpack-dev-tools/clang specifier is as expected'
  )
})
// ----------------------------------------------------------------------------
