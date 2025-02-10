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
        pattern: /\/\w\.ts$/,
        on: 'load',
        transform: c => c.replace(/'\w'/, (m) => `${m.toUpperCase()}`),
      }, {
        pattern: /index/,
        on: 'end',
        rename(name: string) {
          return name.replace(/\.js$/, '.cjs')
        },
      }],
      pattern: /(a|b|index)\.ts$/
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

    const data = (await fs.readFile(path.resolve(temp, 'index.cjs'), 'utf8'))

    assert.ok(data.includes(`var a = "A";`))
    assert.ok(data.includes(`var b = "B";`))
    assert.ok(data.includes(`var c = "c";`)) // ← not transformed
  })
})
