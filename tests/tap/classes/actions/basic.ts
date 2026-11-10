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

// import * as path from 'node:path'
// import { AssertionError } from 'node:assert'

// https://www.npmjs.com/package/tap
import t from 'tap'

// ----------------------------------------------------------------------------

import * as xpm from '../../../../src/index.js'
import { log, testIdempotentInitialisation } from '../../../helpers/index.js'

// ============================================================================

const engine = new xpm.LiquidEngine()
// const log = new Logger({ level: 'info' })

// ----------------------------------------------------------------------------

await t.test('Actions - uninitialised', async (t): Promise<void> => {
  const actions = new xpm.Actions({
    log,
    engine,
    substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
    jsonActions: undefined,
  })

  t.throws(
    () => actions.size,
    { name: 'AssertionError', message: /must be initialised/ },
    'size throws AssertionError with "must be initialised"'
  )

  t.throws(
    () => actions.isEmpty,
    { name: 'AssertionError', message: /must be initialised/ },
    'isEmpty throws AssertionError with "must be initialised"'
  )

  t.throws(
    () => actions.names,
    { name: 'AssertionError', message: /must be initialised/ },
    'names throws AssertionError with "must be initialised"'
  )

  t.throws(
    () => actions.has('nonexistent'),
    { name: 'AssertionError', message: /must be initialised/ },
    'has() throws AssertionError with "must be initialised"'
  )

  t.throws(
    () => actions.get('nonexistent'),
    { name: 'AssertionError', message: /must be initialised/ },
    'get() throws AssertionError with "must be initialised"'
  )
})

await t.test('Actions - undefined', async (t): Promise<void> => {
  const actions = new xpm.Actions({
    log,
    engine,
    substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
    jsonActions: undefined,
  })

  await testIdempotentInitialisation(t, actions, 'actions')

  t.equal(actions.size, 0, 'size 0')
  t.equal(actions.isEmpty, true, 'empty')
  t.equal(actions.names.length, 0, 'names.length 0')

  t.throws(
    () => actions.get('nonexistent'),
    {
      constructor: xpm.ConfigurationError,
      message: /does not exist/,
    },
    'throws ConfigurationError with "does not exist"'
  )
})

await t.test('Actions - at top level', async (t): Promise<void> => {
  const actions = new xpm.Actions({
    log,
    engine,
    substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
    jsonActions: {
      one: 'echo "one"',
      two: ['echo "two-1"', 'echo "two-2"'],
    },
  })

  await testIdempotentInitialisation(t, actions, 'actions')

  t.equal(actions.size, 2, 'size 2')
  t.equal(actions.isEmpty, false, 'not empty after initialise()')
  t.equal(actions.names.length, 2, 'names.length 2')

  t.equal(actions.names[0], 'one', 'names[0] is "one"')
  t.equal(actions.names[1], 'two', 'names[1] is "two"')

  t.equal(actions.has('one'), true, 'has("one") is true')
  t.equal(actions.has('two'), true, 'has("two") is true')
  t.equal(actions.has('three'), false, 'has("three") is false')

  const one = actions.get('one')
  t.equal(one.name, 'one', 'name is "one"')
  t.equal(one.parentActions, actions, 'parentActions is actions')

  t.throws(
    () => one.commands,
    { name: 'AssertionError', message: /must be initialised/ },
    'one.commands throws AssertionError with "must be initialised"'
  )
  await testIdempotentInitialisation(t, one, 'one')

  const oneCommands = one.commands
  t.equal(Array.isArray(oneCommands), true, 'one.commands is array')
  t.equal(oneCommands.length, 1, 'one.commands.length is 1')
  t.equal(oneCommands[0], 'echo "one"', 'one.commands[0] is correct')

  const two = actions.get('two')
  t.equal(two.name, 'two', 'name is "two"')
  t.equal(two.parentActions, actions, 'parentActions is actions')
  await testIdempotentInitialisation(t, two, 'two')

  const twoCommands = two.commands
  t.equal(Array.isArray(twoCommands), true, 'two.commands is array')
  t.equal(twoCommands.length, 2, 'two.commands.length is 2')
  t.equal(twoCommands[0], 'echo "two-1"', 'two.commands[0] is correct')
  t.equal(twoCommands[1], 'echo "two-2"', 'two.commands[1] is correct')
})

await t.test('Actions - in configuration', async (t): Promise<void> => {
  const buildConfigurationsJson: xpm.JsonBuildConfigurations = {
    debug: {
      actions: {
        one: 'echo "one"',
      },
    },
  }

  const buildConfigurations = new xpm.BuildConfigurations({
    log,
    engine,
    substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
    jsonBuildConfigurations: buildConfigurationsJson,
  })
  await buildConfigurations.initialise()

  const buildConfiguration = buildConfigurations.get('debug')
  t.ok(buildConfiguration, 'has debug build configuration')
  debugger
  await buildConfiguration.initialise()

  const actions = buildConfiguration.actions
  t.ok(actions, 'has actions')

  await testIdempotentInitialisation(t, actions, 'actions')

  const actionOne = actions.get('one')
  t.ok(actionOne, 'has action one')

  await testIdempotentInitialisation(t, actionOne, 'actionOne')

  const commands = actionOne.commands
  t.equal(Array.isArray(commands), true, 'actionOne.commands is array')
  t.equal(commands.length, 1, 'actionOne.commands.length is 1')
})

await t.test('Actions - inheritance', async (t): Promise<void> => {
  const inheritedActions = new xpm.Actions({
    log,
    engine,
    substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
    jsonActions: {
      one: 'echo "one"',
      two: 'echo "two"',
    },
  })
  await inheritedActions.initialise()

  const inheritedActionsMap: Map<string, xpm.Action> = new Map()
  for (const name of inheritedActions.names) {
    const action = inheritedActions.get(name)
    inheritedActionsMap!.set(name, action)
  }

  const actions = new xpm.Actions({
    log,
    engine,
    substitutionsVariables: xpm.liquidSubstitutionsVariablesBase,
    jsonActions: {
      two: ['echo "two-1"', 'echo "two-2"'],
      three: 'echo "three"',
    },
    inheritedActionsMap,
  })
  await actions.initialise()

  t.equal(actions.size, 3, 'size 3 after initialise()')
  t.equal(actions.names.length, 3, 'names.length 3 after initialise()')

  t.equal(actions.names[0], 'one', 'names[0] is "one"')
  t.equal(actions.names[1], 'two', 'names[1] is "two"')
  t.equal(actions.names[2], 'three', 'names[2] is "three"')

  const two = actions.get('two')
  await two.initialise()

  const twoCommands = two.commands
  t.equal(Array.isArray(twoCommands), true, 'two.commands is array')
  t.equal(twoCommands.length, 2, 'two.commands.length is 2')
  t.equal(twoCommands[0], 'echo "two-1"', 'two.commands[0] is correct')
  t.equal(twoCommands[1], 'echo "two-2"', 'two.commands[1] is correct')
})
