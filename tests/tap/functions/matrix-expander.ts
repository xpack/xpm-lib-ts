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

import * as os from 'node:os'

// https://www.npmjs.com/package/tap
import t from 'tap'

// ----------------------------------------------------------------------------

import * as xpm from '../../../src/index.js'
import { log } from '../../helpers/index.js'

// ============================================================================

await t.test('processMatrixForExpansion - basic', async (t): Promise<void> => {
  const engine = new xpm.LiquidEngine()

  const matrix = {
    arch: ['x64', 'arm64'],
    os: ['linux', 'darwin'],
  }

  const result = await xpm.processMatrixForExpansion({
    matrix,
    templateName: 'test-template',
    templateType: 'action',
    engine,
    substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
    log,
  })

  t.equal(result.matrixKeys.length, 2, 'has 2 matrix keys')
  t.equal(result.matrixKeys[0], 'arch', 'first key is arch')
  t.equal(result.matrixKeys[1], 'os', 'second key is os')

  t.equal(result.matrixValues.length, 2, 'has 2 matrix value arrays')
  t.same(result.matrixValues[0], ['x64', 'arm64'], 'arch values correct')
  t.same(result.matrixValues[1], ['linux', 'darwin'], 'os values correct')

  t.end()
})

await t.test(
  'processMatrixForExpansion - with substitutions',
  async (t): Promise<void> => {
    const engine = new xpm.LiquidEngine()

    const matrix = {
      platform: ['{{ "linux" }}', '{{ "darwin" }}'],
      version: ['{{ 1 }}{{ 2 }}', '{{ 1 }}{{ 3 }}'],
    }

    const result = await xpm.processMatrixForExpansion({
      matrix,
      templateName: 'test-template',
      templateType: 'buildConfiguration',
      engine,
      substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
      log,
    })

    t.equal(result.matrixKeys.length, 2, 'has 2 matrix keys')
    t.same(
      result.matrixValues[0],
      ['linux', 'darwin'],
      'platform values substituted'
    )
    t.same(result.matrixValues[1], ['12', '13'], 'version values substituted')

    t.end()
  }
)

await t.test(
  'processMatrixForExpansion - multiline substitutions',
  async (t): Promise<void> => {
    const engine = new xpm.LiquidEngine()

    const matrix = {
      values: [`{% for i in (1..3) %}value{{ i }}${os.EOL}{% endfor %}`],
    }

    const result = await xpm.processMatrixForExpansion({
      matrix,
      templateName: 'test-template',
      templateType: 'action',
      engine,
      substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
      log,
    })

    t.equal(result.matrixKeys.length, 1, 'has 1 matrix key')
    t.equal(result.matrixKeys[0], 'values', 'key is values')
    t.equal(result.matrixValues[0]!.length, 3, 'expanded to 3 values')
    t.same(
      result.matrixValues[0],
      ['value1', 'value2', 'value3'],
      'multiline substitution split correctly'
    )

    t.end()
  }
)

await t.test(
  'processMatrixForExpansion - error: matrix key not array',
  async (t): Promise<void> => {
    const engine = new xpm.LiquidEngine()

    const matrix = {
      // Should be an array
      arch: 'x64' as unknown as xpm.JsonTemplateMatrixContent,
    }

    await t.rejects(
      async () => {
        await xpm.processMatrixForExpansion({
          matrix,
          templateName: 'test-template',
          templateType: 'action',
          engine,
          substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
          log,
        })
      },
      {
        constructor: xpm.ConfigurationError,
        message: 'action "test-template" matrix.arch is not an array',
      },
      'throws ConfigurationError for non-array matrix value'
    )

    t.end()
  }
)

await t.test(
  'processMatrixForExpansion - error: matrix value not string',
  async (t): Promise<void> => {
    const engine = new xpm.LiquidEngine()

    const matrix = {
      // Second value is not a string
      arch: ['x64', 123] as unknown as xpm.JsonTemplateMatrixContent,
    }

    await t.rejects(
      async () => {
        await xpm.processMatrixForExpansion({
          matrix,
          templateName: 'test-template',
          templateType: 'buildConfiguration',
          engine,
          substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
          log,
        })
      },
      {
        constructor: xpm.ConfigurationError,
        message:
          'buildConfiguration "test-template" matrix.arch value is not a string',
      },
      'throws ConfigurationError for non-string matrix value'
    )

    t.end()
  }
)

await t.test(
  'processMatrixForExpansion - error: substitution fails',
  async (t): Promise<void> => {
    const engine = new xpm.LiquidEngine()

    const matrix = {
      arch: ['{{ undefined.property }}'], // Will fail during substitution
    }

    await t.rejects(
      async () => {
        await xpm.processMatrixForExpansion({
          matrix,
          templateName: 'my-action',
          templateType: 'action',
          engine,
          substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
          log,
        })
      },
      {
        constructor: xpm.ConfigurationError,
        message: /in action "my-action" matrix substitution/,
      },
      'throws ConfigurationError with context when substitution fails'
    )

    t.end()
  }
)

await t.test(
  'processMatrixForExpansion - multiple keys with mixed substitutions',
  async (t): Promise<void> => {
    const engine = new xpm.LiquidEngine()

    const matrix = {
      plain: ['a', 'b'],
      templated: ['{{ "c" }}', '{{ "d" }}'],
      mixed: ['e', '{{ "f" }}'],
    }

    const result = await xpm.processMatrixForExpansion({
      matrix,
      templateName: 'test-template',
      templateType: 'action',
      engine,
      substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
      log,
    })

    t.equal(result.matrixKeys.length, 3, 'has 3 matrix keys')
    t.same(result.matrixKeys, ['plain', 'templated', 'mixed'], 'keys in order')
    t.same(result.matrixValues[0], ['a', 'b'], 'plain values unchanged')
    t.same(result.matrixValues[1], ['c', 'd'], 'templated values substituted')
    t.same(result.matrixValues[2], ['e', 'f'], 'mixed values handled correctly')

    t.end()
  }
)

await t.test(
  'processMatrixForExpansion - empty matrix',
  async (t): Promise<void> => {
    const engine = new xpm.LiquidEngine()

    const matrix = {}

    const result = await xpm.processMatrixForExpansion({
      matrix,
      templateName: 'test-template',
      templateType: 'action',
      engine,
      substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
      log,
    })

    t.equal(result.matrixKeys.length, 0, 'no matrix keys')
    t.equal(result.matrixValues.length, 0, 'no matrix values')

    t.end()
  }
)

await t.test(
  'processMatrixForExpansion - single value arrays',
  async (t): Promise<void> => {
    const engine = new xpm.LiquidEngine()

    const matrix = {
      single: ['only-one'],
      templated: ['{{ "also-one" }}'],
    }

    const result = await xpm.processMatrixForExpansion({
      matrix,
      templateName: 'test-template',
      templateType: 'buildConfiguration',
      engine,
      substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
      log,
    })

    t.equal(result.matrixKeys.length, 2, 'has 2 matrix keys')
    t.same(result.matrixValues[0], ['only-one'], 'single plain value')
    t.same(result.matrixValues[1], ['also-one'], 'single templated value')

    t.end()
  }
)

// ----------------------------------------------------------------------------
