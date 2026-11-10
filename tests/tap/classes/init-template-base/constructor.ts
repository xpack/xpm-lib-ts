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

import { AssertionError } from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import t from 'tap'

import { Logger } from '@xpack/logger'

// ----------------------------------------------------------------------------

import * as xpm from '../../../../src/index.js'
import { policies, legacyPolicies } from '../../../helpers/policies.js'

// ============================================================================

const mockProcess: NodeJS.Process = {
  env: {},
} as unknown as NodeJS.Process

const mockContext: xpm.Context = {
  log: new Logger({ level: 'info' }),
  config: {
    projectName: 'test-project',
    properties: {
      stringProp: 'a string',
    },
    cwd: process.cwd(),
  },
  rootPath: '/my/root',
}

const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
  stringProp: {
    label: 'String Property',
    description: 'A string property for testing',
    type: 'string',
    default: 'defaultString',
  },
}

// ----------------------------------------------------------------------------

t.test('InitTemplateBase - constructor assertions', (t): void => {

  class XpmInitTemplate extends xpm.InitTemplateBase {
    async generate(): Promise<void> {
      t.fail('generate() should not be called')
    }
  }

  try {
    new XpmInitTemplate({
      context: undefined as unknown as xpm.Context,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions: {},
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown for missing context')
  } catch (error) {
    t.type(error, AssertionError, 'threw an error for missing context')
  }

  try {
    new XpmInitTemplate({
      context: {} as xpm.Context,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions: {},
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown for missing context')
  } catch (error) {
    t.type(error, AssertionError, 'threw an error for missing context.log')
  }

  try {
    new XpmInitTemplate({
      context: { log: new Logger({ level: 'info' }) } as xpm.Context,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions: {},
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown for missing context.config')
  } catch (error) {
    t.type(error, AssertionError, 'threw an error for missing context.config')
  }

  try {
    new XpmInitTemplate({
      context: {
        log: new Logger({ level: 'info' }),
        config: { cwd: process.cwd() },
      } as xpm.Context,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions: {},
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown for missing context')
  } catch (error) {
    t.type(
      error,
      AssertionError,
      'threw an error for missing context.config.projectName'
    )
  }

  try {
    new XpmInitTemplate({
      context: {
        log: new Logger({ level: 'info' }),
        config: {
          projectName: 'test-project',
          cwd: '/my/cwd',
        } as xpm.Config,
      } as xpm.Context,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions: {},
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown for missing context.config.properties')
  } catch (error) {
    t.type(
      error,
      AssertionError,
      'threw an error for missing context.config.properties'
    )
  }

  try {
    new XpmInitTemplate({
      context: {
        log: new Logger({ level: 'info' }),
        config: {
          projectName: 'test-project',
          cwd: '/my/cwd',
          properties: {
            stringProp: 'a string',
          },
        } as xpm.Config,
      } as xpm.Context,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions: {},
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown for missing context.rootPath')
  } catch (error) {
    t.type(error, AssertionError, 'threw an error for missing context.rootPath')
  }

  try {
    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: undefined as unknown as string,
      propertiesDefinitions: {},
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown for missing templatesFolderPath')
  } catch (error) {
    t.type(
      error,
      AssertionError,
      'threw an error for missing templatesFolderPath'
    )
  }

  try {
    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions:
        undefined as unknown as xpm.InitTemplatePropertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown for missing propertiesDefinitions')
  } catch (error) {
    t.type(
      error,
      AssertionError,
      'threw an error for missing propertiesDefinitions'
    )
  }

  t.end()
})

await t.test(
  'InitTemplateBase - empty configuration',
  async (t): Promise<void> => {
    class XpmInitTemplate extends xpm.InitTemplateBase {
      async generate(): Promise<void> {
        t.ok(true, 'generate() called')

        t.same(this.context, mockContext, 'context is correct')
        t.equal(this.context.rootPath, '/my/root', 'rootPath is correct')
        t.equal(
          this.templatesFolderPath,
          '/my/templates',
          'templatesFolderPath is correct'
        )
        t.same(this.process, mockProcess, 'process is correct')

        t.equal(
          this.substitutionsVariables?.projectName,
          'test-project',
          'substitutionsVariables.projectName is correct'
        )
        t.equal(
          this.substitutionsVariables?.year,
          new Date().getFullYear().toString(),
          'substitutionsVariables.year is correct'
        )
        t.equal(
          this.substitutionsVariables?.matrix?.stringProp,
          'a string',
          'substitutionsVariables.matrix.stringProp is correct'
        )

        // Check that liquidSubstitutionsVariablesBase was added.
        t.ok(
          this.substitutionsVariables?.env,
          'substitutionsVariables.env is present'
        )
        t.ok(
          this.substitutionsVariables?.os,
          'substitutionsVariables.os is present'
        )
        t.ok(
          this.substitutionsVariables?.path,
          'substitutionsVariables.path is present'
        )
      }
    }

    const template = new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })

    const exitCode = await template.run()
    t.equal(exitCode, 0, 'exit code is 0')
  }
)

await t.test(
  'InitTemplateBase - topPropertiesXpmInitTemplate',
  async (t): Promise<void> => {
    class XpmInitTemplate extends xpm.InitTemplateBase {
      async generate(): Promise<void> {
        t.ok(true, 'generate() called')

        t.equal(
          this.substitutionsVariables?.stringProp,
          'a string',
          'substitutionsVariables.stringProp is correct (top-level)'
        )

        t.equal(
          (this.substitutionsVariables?.properties as Record<string, unknown>)
            ?.stringProp,
          'a string',
          'substitutionsVariables.properties.stringProp is correct'
        )
      }
    }

    const template = new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies: legacyPolicies,
    })

    const exitCode = await template.run()
    t.equal(exitCode, 0, 'exit code is 0')
  }
)

await t.test('InitTemplateBase - default process', async (t): Promise<void> => {
  class XpmInitTemplate extends xpm.InitTemplateBase {
    async generate(): Promise<void> {
      t.ok(true, 'generate() called')

      t.same(this.process, process, 'process is default')
    }
  }

  const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
    stringProp: {
      label: 'String Property',
      description: 'A string property for testing',
      type: 'string',
      items: {},
      isMandatory: false,
      default: 'defaultString',
    },
  }

  const template = new XpmInitTemplate({
    context: mockContext,
    templatesFolderPath: '/my/templates',
    propertiesDefinitions,
    policies,
  })

  const exitCode = await template.run()
  t.equal(exitCode, 0, 'exit code is 0')
})

// ----------------------------------------------------------------------------
