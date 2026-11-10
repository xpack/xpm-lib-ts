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

import { Readable, Writable } from 'node:stream'

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

// const mockProcess: NodeJS.Process = {
//   env: {},
// } as unknown as NodeJS.Process

// const mockContext: xpm.Context = {
//   log: new Logger({ level: 'info' }),
//   config: {
//     projectName: 'test-project',
//     properties: {
//       stringProp: 'a string',
//     },
//     cwd: process.cwd(),
//   },
// }

// const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
//   stringProp: {
//     label: 'String Property',
//     description: 'A string property for testing',
//     type: 'string',
//     default: 'defaultString',
//   },
// }

class XpmInitTemplate extends xpm.InitTemplateBase {
  async generate(): Promise<void> {}
}

// ----------------------------------------------------------------------------

// https://nodejs.org/docs/latest/api/stream.html#simplified-construction

class MockStdout extends Writable {
  isTTY = true
  output: string[] = []

  override _write(
    chunk: any,
    _encoding: string,
    callback: (error?: Error | null) => void
  ): void {
    const str = chunk.toString()
    this.output.push(str)
    callback()
  }

  clear(): void {
    this.output = []
  }
}

class MockStdin extends Readable {
  isTTY = true
  private readonly inputs: string[]
  private index = 0

  constructor(inputs: string[] = []) {
    super({ encoding: 'utf8', highWaterMark: 0 })
    this.inputs = inputs
  }

  override _read(): void {
    if (this.index < this.inputs.length) {
      // Use setImmediate to simulate async reading
      setImmediate(() => {
        this.push(this.inputs[this.index] + '\n')
        this.index++
      })
    } else {
      // Add a newline to simulate the user pressing Enter after the last input.
      this.push('\n')
      // Signal end of stream
      this.push(null)
    }
  }
}

await t.test(
  'InitTemplateBase - askForMoreValues() without TTY',
  async (t): Promise<void> => {
    class MockStdin extends Readable {
      isTTY = false

      override _read(): void {
        this.push(null) // Signal end of stream
      }
    }

    const mockProcess: NodeJS.Process = {
      env: {},
      stdin: new MockStdin(),
      stdout: process.stdout,
    } as unknown as NodeJS.Process

    const mockContext: xpm.Context = {
      log: new Logger({ level: 'info' }),
      config: {
        projectName: 'test-project',
        properties: {},
        cwd: process.cwd(),
      },
      rootPath: '/my/root',
    }

    const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
      stringProp: {
        label: 'String Property',
        description: 'A string property for testing',
        type: 'string',
        isMandatory: true,
      },
    }

    const template = new XpmInitTemplate({
      context: mockContext,
      templatesFolderPath: '/my/templates',
      propertiesDefinitions,
      process: mockProcess,
      policies,
    })
    await t.rejects(
      () => template.run(),
      {
        constructor: xpm.JsonSyntaxError,
        message: /not possible without a TTY/,
      },
      'throws XpmSyntaxError with "not possible without a TTY"'
    )
  }
)

await t.test(
  'InitTemplateBase - askForMoreValues()',
  async (t): Promise<void> => {
    await t.test('string', async (t): Promise<void> => {
      let mockProcess: NodeJS.Process = {
        env: {},
        stdin: new MockStdin(['baburiba']),
        stdout: new MockStdout(),
      } as unknown as NodeJS.Process

      let mockContext: xpm.Context = {
        log: new Logger({ level: 'info' }),
        config: {
          projectName: 'test-project',
          properties: {
            unused: 'value',
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
          isMandatory: true,
          default: 'defaultString',
        } as xpm.InitTemplatePropertiesDefinition,
        unused: {
          label: 'Unused Property',
          description: 'This property should not be asked for',
          type: 'string',
          isMandatory: false,
          default: 'unusedDefault',
        } as xpm.InitTemplatePropertiesDefinition,
      } as xpm.InitTemplatePropertiesDefinitions

      class XpmInitTemplate extends xpm.InitTemplateBase {
        async generate(): Promise<void> {
          t.ok(true, 'generate() called')

          t.equal(
            this.context.config.properties!.stringProp,
            'baburiba',
            'string property value is correct'
          )
        }
      }

      let template = new XpmInitTemplate({
        context: mockContext,
        templatesFolderPath: '/my/templates',
        propertiesDefinitions,
        process: mockProcess,
        policies,
      })

      await template.run()

      // ----------------------------------------------------------------------

      mockProcess = {
        env: {},
        stdin: new MockStdin(['']),
        stdout: new MockStdout(),
      } as unknown as NodeJS.Process

      mockContext = {
        log: new Logger({ level: 'info' }),
        config: {
          projectName: 'test-project',
          properties: {
            unused: 'value',
          },
          cwd: process.cwd(),
        },
        rootPath: '/my/root',
      }

      class XpmInitTemplate2 extends xpm.InitTemplateBase {
        async generate(): Promise<void> {
          t.ok(true, 'generate() called')

          t.equal(
            this.context.config.properties!.stringProp,
            'defaultString',
            'string property value is default'
          )
        }
      }

      template = new XpmInitTemplate2({
        context: mockContext,
        templatesFolderPath: '/my/templates',
        propertiesDefinitions,
        process: mockProcess,
        policies,
      })

      await template.run()
    })

    await t.test('number', async (t): Promise<void> => {
      let mockProcess: NodeJS.Process = {
        env: {},
        stdin: new MockStdin(['42']),
        stdout: new MockStdout(),
      } as unknown as NodeJS.Process

      let mockContext: xpm.Context = {
        log: new Logger({ level: 'info' }),
        config: {
          projectName: 'test-project',
          properties: {},
          cwd: process.cwd(),
        },
        rootPath: '/my/root',
      }

      const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
        numberProp: {
          label: 'Number Property',
          description: 'A number property for testing',
          type: 'number',
          isMandatory: true,
          default: 43,
        } as xpm.InitTemplatePropertiesDefinition,
      } as xpm.InitTemplatePropertiesDefinitions

      class XpmInitTemplate extends xpm.InitTemplateBase {
        async generate(): Promise<void> {
          t.ok(true, 'generate() called')

          t.equal(
            this.context.config.properties!.numberProp,
            42,
            'number property value is correct'
          )
        }
      }

      let template = new XpmInitTemplate({
        context: mockContext,
        templatesFolderPath: '/my/templates',
        propertiesDefinitions,
        process: mockProcess,
        policies,
      })

      await template.run()

      // ----------------------------------------------------------------------

      mockProcess = {
        env: {},
        stdin: new MockStdin(),
        stdout: new MockStdout(),
      } as unknown as NodeJS.Process

      mockContext = {
        log: new Logger({ level: 'info' }),
        config: {
          projectName: 'test-project',
          properties: {},
          cwd: process.cwd(),
        },
        rootPath: '/my/root',
      }

      class XpmInitTemplate2 extends xpm.InitTemplateBase {
        async generate(): Promise<void> {
          t.ok(true, 'generate() called')

          t.equal(
            this.context.config.properties!.numberProp,
            43,
            'number property value is default'
          )
        }
      }

      template = new XpmInitTemplate2({
        context: mockContext,
        templatesFolderPath: '/my/templates',
        propertiesDefinitions,
        process: mockProcess,
        policies,
      })

      await template.run()
    })

    await t.test('boolean', async (t): Promise<void> => {
      let mockProcess: NodeJS.Process = {
        env: {},
        stdin: new MockStdin(['wrong', 'true']),
        stdout: new MockStdout(),
      } as unknown as NodeJS.Process

      let mockContext: xpm.Context = {
        log: new Logger({ level: 'info' }),
        config: {
          projectName: 'test-project',
          properties: {},
          cwd: process.cwd(),
        },
        rootPath: '/my/root',
      }

      const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
        booleanProp: {
          label: 'Boolean Property',
          description: 'A boolean property for testing',
          type: 'boolean',
          isMandatory: true,
          default: false,
        } as xpm.InitTemplatePropertiesDefinition,
      } as xpm.InitTemplatePropertiesDefinitions

      class XpmInitTemplate extends xpm.InitTemplateBase {
        async generate(): Promise<void> {
          t.ok(true, 'generate() called')

          t.equal(
            this.context.config.properties!.booleanProp,
            true,
            'boolean property value is correct'
          )
        }
      }

      let template = new XpmInitTemplate({
        context: mockContext,
        templatesFolderPath: '/my/templates',
        propertiesDefinitions,
        process: mockProcess,
        policies,
      })

      await template.run()

      // ----------------------------------------------------------------------

      mockProcess = {
        env: {},
        stdin: new MockStdin(),
        stdout: new MockStdout(),
      } as unknown as NodeJS.Process

      mockContext = {
        log: new Logger({ level: 'info' }),
        config: {
          projectName: 'test-project',
          properties: {},
          cwd: process.cwd(),
        },
        rootPath: '/my/root',
      }

      class XpmInitTemplate2 extends xpm.InitTemplateBase {
        async generate(): Promise<void> {
          t.ok(true, 'generate() called')

          t.equal(
            this.context.config.properties!.booleanProp,
            false,
            'boolean property value is default'
          )
        }
      }

      template = new XpmInitTemplate2({
        context: mockContext,
        templatesFolderPath: '/my/templates',
        propertiesDefinitions,
        process: mockProcess,
        policies,
      })

      await template.run()
    })

    await t.test('select', async (t): Promise<void> => {
      let mockProcess: NodeJS.Process = {
        env: {},
        stdin: new MockStdin(['wrong', 'option2']),
        stdout: new MockStdout(),
        platform: 'linux',
        arch: 'x64',
      } as unknown as NodeJS.Process

      let mockContext: xpm.Context = {
        log: new Logger({ level: 'info' }),
        config: {
          projectName: 'test-project',
          properties: {},
          cwd: process.cwd(),
        },
        rootPath: '/my/root',
      }

      const propertiesDefinitions: xpm.InitTemplatePropertiesDefinitions = {
        selectProp: {
          label: 'Select Property',
          description: 'A select property for testing',
          type: 'select',
          isMandatory: true,
          default: 'option3',
          items: {
            option1: 'Option 1',
            option2: 'Option 2',
            option3: { message: 'Option 3', platforms: ['linux', 'win32'] },
            option4: { message: 'Option 4', platforms: ['darwin'] },
          },
        } as xpm.InitTemplatePropertiesDefinition,
      } as xpm.InitTemplatePropertiesDefinitions

      class XpmInitTemplate extends xpm.InitTemplateBase {
        async generate(): Promise<void> {
          t.ok(true, 'generate() called')

          t.equal(
            this.context.config.properties!.selectProp,
            'option2',
            'select property value is correct'
          )
        }
      }

      let template = new XpmInitTemplate({
        context: mockContext,
        templatesFolderPath: '/my/templates',
        propertiesDefinitions,
        process: mockProcess,
        policies,
      })

      await template.run()

      // ----------------------------------------------------------------------

      mockProcess = {
        env: {},
        stdin: new MockStdin(),
        stdout: new MockStdout(),
        platform: 'linux',
        arch: 'x64',
      } as unknown as NodeJS.Process

      mockContext = {
        log: new Logger({ level: 'info' }),
        config: {
          projectName: 'test-project',
          properties: {},
          cwd: process.cwd(),
        },
        rootPath: '/my/root',
      }

      class XpmInitTemplate2 extends xpm.InitTemplateBase {
        async generate(): Promise<void> {
          t.ok(true, 'generate() called')

          t.equal(
            this.context.config.properties!.selectProp,
            'option3',
            'select property value is default'
          )
        }
      }

      template = new XpmInitTemplate2({
        context: mockContext,
        templatesFolderPath: '/my/templates',
        propertiesDefinitions,
        process: mockProcess,
        policies,
      })
      await template.run()
    })
  }
)

// ----------------------------------------------------------------------------
