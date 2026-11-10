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
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import t from 'tap'


// ----------------------------------------------------------------------------

import * as xpm from '../../../src/index.js'
import { log } from '../../helpers/index.js'

// ============================================================================

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const fixturesFolderPath = path.join(
  path.dirname(path.dirname(__dirname)),
  'fixtures'
)

// const log = new Logger({ level: 'info' })

// ----------------------------------------------------------------------------

await t.test(
  'chmodRecursively - basic functionality',
  async (t): Promise<void> => {
    const chmodFolderPath = path.join(fixturesFolderPath, 'chmod-recursively')
    const file1Path = path.join(chmodFolderPath, 'file1.md')
    const file1LinkPath = path.join(chmodFolderPath, 'file1-symlink.md')
    const subFolderPath = path.join(chmodFolderPath, 'subfolder')
    const subFolderLinkPath = path.join(chmodFolderPath, 'subfolder-symlink')
    const file2Path = path.join(subFolderPath, 'file2.md')

    await xpm.chmodRecursively({
      inputPath: chmodFolderPath,
      readOnly: true,
      log,
    })

    let mode = (await fs.lstat(file1Path)).mode
    t.equal(mode & fs.constants.S_IWUSR, 0, 'file1.md is read-only')

    mode = (await fs.lstat(file1LinkPath)).mode
    t.not(mode & fs.constants.S_IWUSR, 0, 'file1-symlink.md is not read-only')

    mode = (await fs.lstat(subFolderPath)).mode
    t.equal(mode & fs.constants.S_IWUSR, 0, 'subfolder is read-only')

    mode = (await fs.lstat(subFolderLinkPath)).mode
    t.not(mode & fs.constants.S_IWUSR, 0, 'subfolder-symlink is not read-only')

    mode = (await fs.lstat(file2Path)).mode
    t.equal(mode & fs.constants.S_IWUSR, 0, 'file2.md is read-only')

    await xpm.chmodRecursively({
      inputPath: chmodFolderPath,
      readOnly: false,
      log,
    })

    mode = (await fs.lstat(file1Path)).mode
    t.not(mode & fs.constants.S_IWUSR, 0, 'file1.md is not read-only')

    mode = (await fs.lstat(subFolderPath)).mode
    t.not(mode & fs.constants.S_IWUSR, 0, 'subfolder is not read-only')

    mode = (await fs.lstat(subFolderLinkPath)).mode
    t.not(mode & fs.constants.S_IWUSR, 0, 'subfolder-symlink is not read-only')

    mode = (await fs.lstat(file2Path)).mode
    t.not(mode & fs.constants.S_IWUSR, 0, 'file2.md is not read-only')

    mode = (await fs.lstat(file1LinkPath)).mode
    t.not(mode & fs.constants.S_IWUSR, 0, 'file1-symlink.md is not read-only')
  }
)

// ----------------------------------------------------------------------------
