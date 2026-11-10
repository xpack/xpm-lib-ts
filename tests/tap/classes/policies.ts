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

import * as xpm from '../../../src/index.js'
import { log } from '../../helpers/index.js'

// ============================================================================

// const log = new Logger({ level: 'info' })

// ----------------------------------------------------------------------------

t.test('Policies - default version', (t): void => {
  const policies = new xpm.Policies({ log, minVersion: 'x.y.z' })
  t.equal(policies.minVersion, '0.0.0', 'minVersion set to default')
  t.equal(policies.shareNpmDependencies, false, 'shareNpmDependencies false')
  t.equal(
    policies.nonHierarchicalLocalXpacksFolder,
    false,
    'nonHierarchicalLocalXpacksFolder false'
  )
  t.equal(
    policies.onlyStringDependencies,
    false,
    'onlyStringDependencies false'
  )
  t.equal(
    policies.singleParameterXpmInitTemplate,
    false,
    'singleParameterXpmInitTemplate false'
  )
  t.equal(
    policies.topPropertiesXpmInitTemplate,
    false,
    'topPropertiesXpmInitTemplate false'
  )

  t.end()
})

t.test('Policies - version 0.1.2', (t): void => {
  const policies = new xpm.Policies({ log, minVersion: '0.1.2' })
  t.equal(policies.minVersion, '0.1.2', 'minVersion set correctly')
  t.equal(policies.shareNpmDependencies, true, 'shareNpmDependencies true')
  t.equal(
    policies.nonHierarchicalLocalXpacksFolder,
    true,
    'nonHierarchicalLocalXpacksFolder true'
  )
  t.equal(policies.onlyStringDependencies, true, 'onlyStringDependencies true')
  t.equal(
    policies.singleParameterXpmInitTemplate,
    true,
    'singleParameterXpmInitTemplate true'
  )
  t.equal(
    policies.topPropertiesXpmInitTemplate,
    true,
    'topPropertiesXpmInitTemplate true'
  )

  t.end()
})

t.test('Policies - version 0.14.0', (t): void => {
  const policies = new xpm.Policies({ log, minVersion: '0.14.0' })
  t.equal(policies.shareNpmDependencies, false, 'shareNpmDependencies false')
  t.equal(
    policies.nonHierarchicalLocalXpacksFolder,
    true,
    'nonHierarchicalLocalXpacksFolder true'
  )
  t.equal(policies.onlyStringDependencies, true, 'onlyStringDependencies true')
  t.equal(
    policies.singleParameterXpmInitTemplate,
    true,
    'singleParameterXpmInitTemplate true'
  )
  t.equal(
    policies.topPropertiesXpmInitTemplate,
    true,
    'topPropertiesXpmInitTemplate true'
  )

  t.end()
})

t.test('Policies - version 0.16.0', (t): void => {
  const policies = new xpm.Policies({ log, minVersion: '0.16.0' })
  t.equal(policies.shareNpmDependencies, false, 'shareNpmDependencies false')
  t.equal(
    policies.nonHierarchicalLocalXpacksFolder,
    false,
    'nonHierarchicalLocalXpacksFolder false'
  )
  t.equal(
    policies.onlyStringDependencies,
    false,
    'onlyStringDependencies false'
  )
  t.equal(
    policies.singleParameterXpmInitTemplate,
    true,
    'singleParameterXpmInitTemplate true'
  )
  t.equal(
    policies.topPropertiesXpmInitTemplate,
    true,
    'topPropertiesXpmInitTemplate true'
  )

  t.end()
})

t.test('Policies - version 0.22.0', (t): void => {
  const policies = new xpm.Policies({ log, minVersion: '0.22.0' })
  t.equal(policies.shareNpmDependencies, false, 'shareNpmDependencies false')
  t.equal(
    policies.nonHierarchicalLocalXpacksFolder,
    false,
    'nonHierarchicalLocalXpacksFolder false'
  )
  t.equal(
    policies.onlyStringDependencies,
    false,
    'onlyStringDependencies false'
  )
  t.equal(
    policies.singleParameterXpmInitTemplate,
    false,
    'singleParameterXpmInitTemplate false'
  )
  t.equal(
    policies.topPropertiesXpmInitTemplate,
    true,
    'topPropertiesXpmInitTemplate true'
  )

  t.end()
})

t.test('Policies - version 0.23.0', (t): void => {
  const policies = new xpm.Policies({ log, minVersion: '0.23.0' })
  t.equal(policies.shareNpmDependencies, false, 'shareNpmDependencies false')
  t.equal(
    policies.nonHierarchicalLocalXpacksFolder,
    false,
    'nonHierarchicalLocalXpacksFolder false'
  )
  t.equal(
    policies.onlyStringDependencies,
    false,
    'onlyStringDependencies false'
  )
  t.equal(
    policies.singleParameterXpmInitTemplate,
    false,
    'singleParameterXpmInitTemplate false'
  )
  t.equal(
    policies.topPropertiesXpmInitTemplate,
    false,
    'topPropertiesXpmInitTemplate false'
  )

  t.end()
})

// ----------------------------------------------------------------------------
