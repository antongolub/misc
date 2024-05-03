import * as assert from 'node:assert'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { type BuildOptions, build } from 'esbuild'
import { transformHookPlugin, getFiles, transformFile, THook } from '../../main/ts/plugin'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')
const temp = path.resolve(__dirname, '../temp')

describe('plugin', () => {
  it.skip('getFiles() returns dir contents', async () => {
    const files = await getFiles(fixtures)
    assert.deepEqual(files.map(f => path.basename(f)).sort(), ['a.ts', 'b.ts', 'index.ts'])
  })

  it.skip('transform() applies hooks', async () => {
    const file1 = {
      contents: 'foo',
      path: 'index.ts',
    }
    const file2 = {
      contents: 'bar',
      path: 'plugin.js',
    }
    const hooks: THook[] = [
      {
        pattern: /index/,
        on: 'load',
        transform: c => c.replace('foo', 'bar'),
      },
      {
        pattern: /index/,
        on: 'end',
        rename() { return 'index.cjs' },
      }
    ]

    const result1 = await transformFile(file1, hooks)
    assert.equal(result1.contents, 'bar')
    assert.equal(result1.path, 'index.cjs')

    const result2 = await transformFile(file2, hooks)
    assert.equal(result2, undefined)
  })

  it('applies hooks', async () => {
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
