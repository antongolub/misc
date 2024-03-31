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
  it('generates esm reexport files', async () => {
    const cwd = fixtures
    const plugin = hybridExportPlugin()
    const config: BuildOptions = {
      entryPoints: [
        'index.ts',
      ],
      plugins: [plugin],
      platform: 'node',
      external: ['node:*'],
      bundle: true,
      minify: false,
      sourcemap: false,
      format: 'cjs',
      legalComments: 'none',
      absWorkingDir: cwd,
      outdir: temp,
      allowOverwrite: true,
    }
    let error: Error | undefined

    try {
      await build(config)
    } catch (err) {
      error = err
    }
    // assert.ok(error.message.endsWith('esbuild-plugin-entry-chunks requires `bundle: true`'))
  })
})
