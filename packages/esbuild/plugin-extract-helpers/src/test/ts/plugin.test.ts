import * as assert from 'node:assert'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { type BuildOptions, build } from 'esbuild'
import { extractHelpersPlugin } from '../../main/ts/plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')
const temp = path.resolve(__dirname, '../temp')

describe('plugin', () => {
  it('extract helpers from bundles', async () => {
    const cwd = fixtures
    const plugin = extractHelpersPlugin({
      hooks: [{
        pattern: /a/,
        on: 'load',
        transform: c => c.replace("'a'", "'A'"),
      }, {
        pattern: /index/,
        on: 'end',
        rename(name: string) {
          return name.replace(/\.js$/, '.cjs')
        },
      }],
    })
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
      outdir: path.resolve(temp),
      allowOverwrite: true,
    }

    await build(config)

    const helperContents = await fs.readFile(path.resolve(temp, 'esblib.cjs'), 'utf8')
    const indexContents = await fs.readFile(path.resolve(temp, 'index.js'), 'utf8')

    assert.ok(helperContents.includes(`var __export = (target, all) => {`))
    assert.ok(indexContents.includes(`const {
  __export,
  __toCommonJS
} = require('./esblib.cjs');`))
  })
})
