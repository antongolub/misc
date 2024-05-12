import * as assert from 'node:assert'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { type BuildOptions, build } from 'esbuild'
import { transformHookPlugin } from '../../main/ts/plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')
const temp = path.resolve(__dirname, '../temp')

describe('plugin', () => {
  it('applies transformation hooks', async () => {
    const cwd = fixtures
    const plugin = transformHookPlugin({
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

    assert.ok((await fs.readFile(path.resolve(temp, 'index.cjs'), 'utf8')).includes(`var a = "A";`))
  })
})
