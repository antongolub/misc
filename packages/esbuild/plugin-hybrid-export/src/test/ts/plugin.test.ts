import * as assert from 'node:assert'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { describe, it } from 'node:test'
import {fileURLToPath} from 'node:url'

import { type BuildOptions, build } from 'esbuild'
import { hybridExportPlugin } from '../../main/ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')
const temp = path.resolve(__dirname, '../temp')

describe('plugin()', () => {
  it.skip('throws if bundle is false', async () => {
    const plugin = hybridExportPlugin()
    const config: BuildOptions = {
      plugins: [plugin],
    }
    let error: Error | undefined

    try {
      await build(config)
    } catch (err) {
      error = err
    }
    assert.ok(error.message.endsWith('esbuild-plugin-entry-chunks requires `bundle: true`'))
  })
})
