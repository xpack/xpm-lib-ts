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

// https://www.npmjs.com/package/tap
import t from 'tap'

import { Logger } from '@xpack/logger'

// ----------------------------------------------------------------------------

import * as xpm from '../../../src/index.js'

// ============================================================================

const log = new Logger({ level: 'info' })

// ----------------------------------------------------------------------------

await t.test(
  'CombinationsGenerator - empty matrix',
  async (t): Promise<void> => {
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: [],
      matrixValues: [],
      log,
    })

    const combinations = [...generator.generate()]
    t.equal(combinations.length, 0, 'empty matrix produces no combinations')
  }
)

await t.test(
  'CombinationsGenerator - single parameter with single value',
  async (t): Promise<void> => {
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: ['arch'],
      matrixValues: [['x64']],
      log,
    })

    const combinations = [...generator.generate()]
    t.equal(combinations.length, 1, 'produces one combination')
    t.same(combinations[0], { arch: 'x64' }, 'correct combination')
  }
)

await t.test(
  'CombinationsGenerator - single parameter with multiple values',
  async (t): Promise<void> => {
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: ['arch'],
      matrixValues: [['x64', 'arm64', 'ia32']],
      log,
    })

    const combinations = [...generator.generate()]
    t.equal(combinations.length, 3, 'produces three combinations')
    t.same(combinations[0], { arch: 'x64' }, 'first combination')
    t.same(combinations[1], { arch: 'arm64' }, 'second combination')
    t.same(combinations[2], { arch: 'ia32' }, 'third combination')
  }
)

await t.test(
  'CombinationsGenerator - two parameters',
  async (t): Promise<void> => {
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: ['arch', 'optimise'],
      matrixValues: [
        ['x64', 'arm64'],
        ['speed', 'size'],
      ],
      log,
    })

    const combinations = [...generator.generate()]
    t.equal(combinations.length, 4, 'produces four combinations')
    t.same(
      combinations[0],
      { arch: 'x64', optimise: 'speed' },
      'first combination'
    )
    t.same(
      combinations[1],
      { arch: 'x64', optimise: 'size' },
      'second combination'
    )
    t.same(
      combinations[2],
      { arch: 'arm64', optimise: 'speed' },
      'third combination'
    )
    t.same(
      combinations[3],
      { arch: 'arm64', optimise: 'size' },
      'fourth combination'
    )
  }
)

await t.test(
  'CombinationsGenerator - three parameters',
  async (t): Promise<void> => {
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: ['platform', 'arch', 'buildType'],
      matrixValues: [
        ['linux', 'darwin'],
        ['x64', 'arm64'],
        ['debug', 'release'],
      ],
      log,
    })

    const combinations = [...generator.generate()]
    t.equal(combinations.length, 8, 'produces eight combinations')

    // Verify first and last combinations
    t.same(
      combinations[0],
      { platform: 'linux', arch: 'x64', buildType: 'debug' },
      'first combination'
    )
    t.same(
      combinations[7],
      { platform: 'darwin', arch: 'arm64', buildType: 'release' },
      'last combination'
    )

    // Verify all combinations have all keys
    for (const combo of combinations) {
      t.ok('platform' in combo, 'combination has platform')
      t.ok('arch' in combo, 'combination has arch')
      t.ok('buildType' in combo, 'combination has buildType')
    }
  }
)

await t.test(
  'CombinationsGenerator - parameter with empty values array',
  async (t): Promise<void> => {
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: ['arch'],
      matrixValues: [[]],
      log,
    })

    const combinations = [...generator.generate()]
    t.equal(combinations.length, 0, 'produces zero combinations')
  }
)

await t.test(
  'CombinationsGenerator - mixed empty and non-empty arrays',
  async (t): Promise<void> => {
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: ['arch', 'optimise'],
      matrixValues: [['x64', 'arm64'], []],
      log,
    })

    const combinations = [...generator.generate()]
    t.equal(combinations.length, 0, 'produces zero combinations')
  }
)

await t.test(
  'CombinationsGenerator - generator pattern yields one at a time',
  async (t): Promise<void> => {
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: ['arch', 'optimise'],
      matrixValues: [
        ['x64', 'arm64'],
        ['speed', 'size'],
      ],
      log,
    })

    let count = 0
    for (const combo of generator.generate()) {
      count++
      t.ok(
        typeof combo === 'object' && combo !== null,
        `combination ${String(count)} is object`
      )
      t.ok('arch' in combo, `combination ${String(count)} has arch`)
      t.ok('optimise' in combo, `combination ${String(count)} has optimise`)
    }

    t.equal(count, 4, 'iterated over four combinations')
  }
)

await t.test(
  'CombinationsGenerator - each combination is independent',
  async (t): Promise<void> => {
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: ['arch'],
      matrixValues: [['x64', 'arm64']],
      log,
    })

    const combinations = [...generator.generate()]

    // Modify first combination
    combinations[0]!.arch = 'modified'

    // Verify second combination is unaffected
    t.equal(combinations[1]!.arch, 'arm64', 'combinations are independent')
  }
)

await t.test(
  'CombinationsGenerator - exceeds maximum combinations limit (default)',
  async (t): Promise<void> => {
    // Create a matrix that would generate 100,000 combinations
    // 10 parameters with 10 values each = 10^10 combinations
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: Array.from({ length: 10 }, (_, i) => `param${String(i)}`),
      matrixValues: Array.from({ length: 10 }, () =>
        Array.from({ length: 10 }, (_, i) => `value${String(i)}`)
      ),
      log,
    })

    await t.rejects(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const _combo of generator.generate()) {
          // Should throw before first iteration
        }
      },
      {
        constructor: xpm.ConfigurationError,
        message: /exceeding limit/,
      },
      'throws ConfigurationError when exceeding default limit'
    )
  }
)

await t.test(
  'CombinationsGenerator - custom maximum combinations limit',
  async (t): Promise<void> => {
    // Create a matrix that would generate 8 combinations
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: ['a', 'b', 'c'],
      matrixValues: [
        ['1', '2'],
        ['3', '4'],
        ['5', '6'],
      ],
      maxCombinations: 5,
      log,
    })

    await t.rejects(
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        for (const _combo of generator.generate()) {
          // Should throw before first iteration
        }
      },
      {
        constructor: xpm.ConfigurationError,
        message: /exceeding limit/,
      },
      'throws ConfigurationError when exceeding custom limit'
    )
  }
)

await t.test(
  'CombinationsGenerator - within custom maximum limit',
  async (t): Promise<void> => {
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: ['a', 'b'],
      matrixValues: [
        ['1', '2'],
        ['3', '4'],
      ],
      maxCombinations: 4,
      log,
    })

    const combinations = [...generator.generate()]
    t.equal(combinations.length, 4, 'generates all combinations within limit')
  }
)

await t.test(
  'CombinationsGenerator - large matrix within limits',
  async (t): Promise<void> => {
    // 5 parameters with 4 values each = 1024 combinations
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: ['p1', 'p2', 'p3', 'p4', 'p5'],
      matrixValues: [
        ['a', 'b', 'c', 'd'],
        ['e', 'f', 'g', 'h'],
        ['i', 'j', 'k', 'l'],
        ['m', 'n', 'o', 'p'],
        ['q', 'r', 's', 't'],
      ],
      maxCombinations: 1500,
      log,
    })

    let count = 0
    for (const combo of generator.generate()) {
      count++
      if (Object.keys(combo).length !== 5) {
        t.fail(`combination ${String(count)} has 5 keys`)
      }
    }

    const expectedCount = 4 * 4 * 4 * 4 * 4 // 5 params × 4 values each
    t.equal(count, expectedCount, 'generates correct number (4^5 = 1024)')
  }
)

await t.test(
  'CombinationsGenerator - verify Cartesian product correctness',
  async (t): Promise<void> => {
    const generator = new xpm.CombinationsGenerator({
      matrixKeys: ['x', 'y'],
      matrixValues: [
        ['a', 'b'],
        ['1', '2', '3'],
      ],
      log,
    })

    const combinations = [...generator.generate()]
    const expected = [
      { x: 'a', y: '1' },
      { x: 'a', y: '2' },
      { x: 'a', y: '3' },
      { x: 'b', y: '1' },
      { x: 'b', y: '2' },
      { x: 'b', y: '3' },
    ]

    t.equal(combinations.length, expected.length, 'correct number produced')
    t.same(
      combinations,
      expected,
      'combinations match expected Cartesian product'
    )
  }
)

// ----------------------------------------------------------------------------
