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

// import { fileURLToPath } from 'node:url'
// import * as path from 'node:path'
import { AssertionError } from 'node:assert'

// ----------------------------------------------------------------------------

// https://www.npmjs.com/package/tap
import t from 'tap'

import { Logger } from '@xpack/logger'

// ----------------------------------------------------------------------------

import * as xpm from '../../../../src/index.js'
import { policies } from '../../../helpers/policies.js'

// ============================================================================

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

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

// class XpmInitTemplate extends xpm.InitTemplateBase {
//   async generate(): Promise<void> {}
// }

// ----------------------------------------------------------------------------

await t.test(
  'InitTemplateBase - _validatePropertyValue()',
  async (t): Promise<void> => {
    const mockProcess: NodeJS.Process = {
      env: {},
      platform: 'linux',
      arch: 'x64',
    } as unknown as NodeJS.Process

    const mockContext: xpm.Context = {
      log: new Logger({ level: 'info' }),
      config: {
        projectName: 'test-project',
        properties: {
          stringProp: 'a string',
          numberProp: '43',
          booleanProp: 'true',
          booleanPropTrue: 'false',
          selectProp: 'option2',
          selectPropPlatform: 'option2',
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
        items: {},
        isMandatory: false,
        default: 'defaultString',
      },
      stringPropNoDefault: {
        label: 'String Property Without Default',
        description: 'A string property for testing',
        type: 'string',
        items: {},
        isMandatory: false,
      },
      numberProp: {
        label: 'Number Property',
        description: 'A number property for testing',
        type: 'number',
        items: {},
        isMandatory: false,
        default: 42,
      },
      booleanProp: {
        label: 'Boolean Property',
        description: 'A boolean property for testing',
        type: 'boolean',
        items: {},
        isMandatory: false,
        default: false,
      },
      booleanPropTrue: {
        label: 'Boolean Property',
        description: 'A boolean property for testing',
        type: 'boolean',
        items: {},
        isMandatory: false,
        default: true,
      },
      selectProp: {
        label: 'Select Property',
        description: 'A select property for testing',
        type: 'select',
        items: {
          option1: 'Option 1',
          option2: 'Option 2',
        },
        isMandatory: false,
        default: 'option1',
      },
      selectPropPlatform: {
        label: 'Select Property',
        description: 'A select property for testing',
        type: 'select',
        items: {
          option1: {
            platforms: ['linux', 'win32'],
            message: 'Option 1',
          },
          option2: {
            platforms: ['linux', 'win32'],
            message: 'Option 2',
          },
          option3: {
            platforms: ['darwin', 'win32'],
            message: 'Option 3',
          },
        },
        isMandatory: false,
        default: 'option1',
      },
    }

    class XpmInitTemplate extends xpm.InitTemplateBase {
      async generate(): Promise<void> {
        t.ok(true, 'generate() called')

        const config = this.context.config

        t.equal(
          xpm.isString(config.properties!.stringProp),
          true,
          'stringProp is string'
        )
        t.equal(
          xpm.isNumber(config.properties!.numberProp),
          true,
          'numberProp is number'
        )
        t.equal(
          xpm.isBoolean(config.properties!.booleanProp),
          true,
          'booleanProp is boolean'
        )
        t.equal(
          xpm.isString(config.properties!.selectProp),
          true,
          'selectProp is string'
        )
        t.equal(
          xpm.isString(config.properties!.selectPropPlatform),
          true,
          'selectPropPlatform is string'
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

    // ------------------------------------------------------------------------
    // Test defaults.

    await t.test('defaults', async (t): Promise<void> => {
      const mockContext: xpm.Context = {
        log: new Logger({ level: 'info' }),
        config: {
          projectName: 'test-project',
          properties: {
            stringProp: '',
          },
          cwd: process.cwd(),
        },
        rootPath: '/my/root',
      }

      class XpmInitTemplate extends xpm.InitTemplateBase {
        async generate(): Promise<void> {
          t.ok(true, 'generate() called')

          const config = this.context.config

          t.equal(
            xpm.isString(config.properties!.stringProp),
            true,
            'stringProp is string'
          )
          t.equal(
            config.properties!.stringProp,
            propertiesDefinitions.stringProp.default,
            'stringProp is default'
          )

          t.equal(
            xpm.isNumber(config.properties!.numberProp),
            true,
            'numberProp is number'
          )
          t.equal(
            config.properties!.numberProp,
            propertiesDefinitions.numberProp.default,
            'numberProp is default'
          )

          t.equal(
            xpm.isBoolean(config.properties!.booleanProp),
            true,
            'booleanProp is boolean'
          )
          t.equal(
            config.properties!.booleanProp,
            propertiesDefinitions.booleanProp.default,
            'booleanProp is default'
          )

          t.equal(
            xpm.isBoolean(config.properties!.booleanPropTrue),
            true,
            'booleanPropTrue is boolean'
          )
          t.equal(
            config.properties!.booleanPropTrue,
            propertiesDefinitions.booleanPropTrue.default,
            'booleanPropTrue is default'
          )

          t.equal(
            xpm.isString(config.properties!.selectProp),
            true,
            'selectProp is string'
          )
          t.equal(
            config.properties!.selectProp,
            propertiesDefinitions.selectProp.default,
            'selectProp is default'
          )

          t.equal(
            xpm.isString(config.properties!.selectPropPlatform),
            true,
            'selectPropPlatform is string'
          )
          t.equal(
            config.properties!.selectPropPlatform,
            propertiesDefinitions.selectPropPlatform.default,
            'selectPropPlatform is default'
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
    })

    // ------------------------------------------------------------------------
    // Test errors.
    const log = new Logger({ level: 'silent' }) // <---

    await t.test('missing property', async (t): Promise<void> => {
      const mockContext: xpm.Context = {
        log,
        config: {
          projectName: 'test-project',
          properties: {
            undefinedProp: 'some value',
            undefinedProp2: 'some value', // Two of them.
          },
          cwd: process.cwd(),
        },
        rootPath: '/my/root',
      }

      try {
        const template = new XpmInitTemplate({
          context: mockContext,
          templatesFolderPath: '/my/templates',
          propertiesDefinitions,
          process: mockProcess,
          policies,
        })

        await template.run()
        t.fail('should have thrown for missing property')
      } catch (error) {
        t.type(
          error,
          xpm.JsonSyntaxError,
          'threw an error for missing property'
        )
        t.match(
          (error as Error).message,
          'invalid properties',
          'error message is "invalid properties"'
        )
      }
    })

    await t.test('platform not supported', async (t): Promise<void> => {
      const mockContext: xpm.Context = {
        log,
        config: {
          projectName: 'test-project',
          properties: {
            selectPropPlatform: 'some option3',
          },
          cwd: process.cwd(),
        },
        rootPath: '/my/root',
      }

      try {
        const template = new XpmInitTemplate({
          context: mockContext,
          templatesFolderPath: '/my/templates',
          propertiesDefinitions,
          process: mockProcess,
          policies,
        })

        await template.run()
        t.fail('should have thrown for unsupported platform')
      } catch (error) {
        t.type(
          error,
          xpm.JsonSyntaxError,
          'threw an error for unsupported platform'
        )
        t.match(
          (error as Error).message,
          'invalid property',
          'error message is "invalid property"'
        )
      }
    })

    await t.test('bad binary value', async (t): Promise<void> => {
      const mockContext: xpm.Context = {
        log,
        config: {
          projectName: 'test-project',
          properties: {
            booleanProp: 'maybe',
          },
          cwd: process.cwd(),
        },
        rootPath: '/my/root',
      }

      try {
        const template = new XpmInitTemplate({
          context: mockContext,
          templatesFolderPath: '/my/templates',
          propertiesDefinitions,
          process: mockProcess,
          policies,
        })

        await template.run()
        t.fail('should have thrown for bad binary value')
      } catch (error) {
        t.type(
          error,
          xpm.JsonSyntaxError,
          'threw an error for bad binary value'
        )
        t.match(
          (error as Error).message,
          'invalid property',
          'error message is "invalid property"'
        )
      }
    })

    await t.test('bad number', async (t): Promise<void> => {
      const mockContext: xpm.Context = {
        log,
        config: {
          projectName: 'test-project',
          properties: {
            numberProp: 'not a number',
          },
          cwd: process.cwd(),
        },
        rootPath: '/my/root',
      }

      try {
        const template = new XpmInitTemplate({
          context: mockContext,
          templatesFolderPath: '/my/templates',
          propertiesDefinitions,
          process: mockProcess,
          policies,
        })

        await template.run()
        t.fail('should have thrown for bad number value')
      } catch (error) {
        t.type(
          error,
          xpm.JsonSyntaxError,
          'threw an error for bad number value'
        )
        t.match(
          (error as Error).message,
          'invalid property',
          'error message is "invalid property"'
        )
      }
    })

    await t.test('string without default', async (t): Promise<void> => {
      const mockContext: xpm.Context = {
        log,
        config: {
          projectName: 'test-project',
          properties: {
            stringPropNoDefault: '',
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
          items: {},
          isMandatory: false,
          default: 'defaultString',
        },
        stringPropNoDefault: {
          label: 'String Property Without Default',
          description: 'A string property for testing',
          type: 'string',
          items: {},
          isMandatory: false,
        },
      }

      try {
        const template = new XpmInitTemplate({
          context: mockContext,
          templatesFolderPath: '/my/templates',
          propertiesDefinitions,
          process: mockProcess,
          policies,
        })

        await template.run()
        t.fail('should have thrown for string without default value')
      } catch (error) {
        t.type(
          error,
          xpm.JsonSyntaxError,
          'threw an error for string without default value'
        )
      }
    })
  }
)

// ----------------------------------------------------------------------------

t.test('InitTemplateBase - _validatePropertiesDefinitions()', (t): void => {
  class XpmInitTemplate extends xpm.InitTemplateBase {
    async generate(): Promise<void> {
      t.fail('generate() should not be called')
    }
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions =
      42 as unknown as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'is not an object',
      'error message is "not an object"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions =
      {} as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'is an empty object',
      'error message is "is an empty object"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      stringProp: {} as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'must have a string label',
      'error message is "must have a string label"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      stringProp: {
        label: 42 as unknown as string,
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'must have a string label',
      'error message is "must have a string label"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      stringProp: {
        label: ' ',
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has an empty label',
      'error message is "has an empty label"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      stringProp: {
        label: 'string property',
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'must have a string description',
      'error message is "must have a string description"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      stringProp: {
        label: 'string property',
        description: 42 as unknown as string,
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'must have a string description',
      'error message is "must have a string description"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      stringProp: {
        label: 'string property',
        description: ' ',
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has an empty description',
      'error message is "has an empty description"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      stringProp: {
        label: 'string property',
        description: 'string description',
        isMandatory: 'not a boolean' as unknown as boolean,
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has a non boolean isMandatory value',
      'error message is "has a non boolean isMandatory value"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      stringProp: {
        label: 'string property',
        description: 'string description',
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has no type defined',
      'error message is "has no type defined"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      selectProp: {
        label: 'select property',
        description: 'select description',
        type: 'select',
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      "type 'select' has no items",
      'error message is "type \'select\' has no items"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      selectProp: {
        label: 'select property',
        description: 'select description',
        type: 'select',
        items: 42 as unknown as xpm.InitTemplateItems,
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      "type 'select' has invalid items",
      'error message is "type \'select\' has invalid items"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      selectProp: {
        label: 'select property',
        description: 'select description',
        type: 'select',
        items: {} as unknown as xpm.InitTemplateItems,
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      "type 'select' has no items",
      'error message is "type \'select\' has no items"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      selectProp: {
        label: 'select property',
        description: 'select description',
        type: 'select',
        items: {
          option1: 42 as unknown as string,
        } as unknown as xpm.InitTemplateItems,
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has invalid item',
      'error message is "has invalid item"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      selectProp: {
        label: 'select property',
        description: 'select description',
        type: 'select',
        items: {
          option1: {
            platforms: 'not an array' as unknown as string[],
            message: 'Option 1',
          },
        } as unknown as xpm.InitTemplateItems,
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has invalid item',
      'error message is "has invalid item"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      selectProp: {
        label: 'select property',
        description: 'select description',
        type: 'select',
        items: {
          option1: {
            platforms: ['linux', 'win32'],
            message: 42 as unknown as string,
          },
        } as unknown as xpm.InitTemplateItems,
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has invalid item',
      'error message is "has invalid item"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      selectProp: {
        label: 'select property',
        description: 'select description',
        type: 'select',
        items: {
          option1: 'option 1',
          option2: 'option 2',
        },
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'must have a default value if not mandatory',
      'error message is "hmust have a default value if not mandatory"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      selectProp: {
        label: 'select property',
        description: 'select description',
        type: 'select',
        items: {
          option1: 'option 1',
          option2: 'option 2',
        },
        default: 42 as unknown as string,
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has a non string default value',
      'error message is "has a non string default value"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      selectProp: {
        label: 'select property',
        description: 'select description',
        type: 'select',
        items: {
          option1: 'option 1',
          option2: 'option 2',
        },
        default: ' ',
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has an empty default value',
      'error message is "has an empty default value"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      selectProp: {
        label: 'select property',
        description: 'select description',
        type: 'select',
        items: {
          option1: 'option 1',
          option2: 'option 2',
        },
        default: 'nonexistent option',
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has a default value not in items list',
      'error message is "has a default value not in items list"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      stringProp: {
        label: 'string property',
        description: 'string description',
        type: 'string',
        default: 42,
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has a non string default value',
      'error message is "has a non string default value"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      stringProp: {
        label: 'string property',
        description: 'string description',
        type: 'string',
        default: ' ',
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has an empty default value',
      'error message is "has an empty default value"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      numberProp: {
        label: 'number property',
        description: 'number description',
        type: 'number',
        default: 'not a number',
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has a non number default value',
      'error message is "has a non number default value"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      BooleanProp: {
        label: 'boolean property',
        description: 'boolean description',
        type: 'boolean',
        default: 'not a boolean',
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has a non boolean default value',
      'error message is "has a non boolean default value"'
    )
  }

  try {
    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      unknownProp: {
        label: 'unknown property',
        description: 'unknown description',
        type: 'unknown' as xpm.InitTemplateType,
      } as xpm.InitTemplatePropertiesDefinition,
    } as xpm.InitTemplatePropertiesDefinitions

    new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    t.fail('should have thrown')
  } catch (error) {
    t.type(error, AssertionError, 'threw an AssertionError')
    t.match(
      (error as AssertionError).message,
      'has unsupported type',
      'error message is "has unsupported type"'
    )
  }

  t.end()
})

// ----------------------------------------------------------------------------

t.test('InitTemplateBase - isPlatformSupported()', (t): void => {
  const mockProcess: NodeJS.Process = {
    env: {},
    platform: 'linux',
    arch: 'x64',
  } as unknown as NodeJS.Process

  class XpmInitTemplate extends xpm.InitTemplateBase {
    async generate(): Promise<void> {
      t.fail('generate() should not be called')
    }
  }

  const template = new XpmInitTemplate({
    context: mockContext,
    templatesFolderPath: '/my/templates',
    propertiesDefinitions,
    process: mockProcess,
    policies,
  })

  t.equal(
    template.isPlatformSupported(['linux-x64', 'win32']),
    true,
    'linux-x64 is supported'
  )

  t.equal(
    template.isPlatformSupported(['linux', 'win32']),
    true,
    'linux is supported'
  )

  t.equal(
    template.isPlatformSupported(['darwin']),
    false,
    'darwin is not supported'
  )

  t.throws(
    () => template.isPlatformSupported([]),
    {
      name: 'AssertionError',
      message: /platforms array is required/,
    },
    'throws AssertionError with "platforms array is required"'
  )

  t.end()
})

// ----------------------------------------------------------------------------
