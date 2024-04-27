import * as assert from 'node:assert'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { type BuildOptions, build } from 'esbuild'
import { hybridExportPlugin } from '../../main/ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')
const temp = path.resolve(__dirname, '../temp')

describe('plugin()', () => {
  it('generates esm files (mixed case)', async () => {
    const cwd = path.resolve(fixtures, 'mixed-exports')
    const plugin = hybridExportPlugin({
      to: '../../temp/mixed',
      toExt: '.mjs',
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
      outdir: path.resolve(temp, 'mixed'),
      allowOverwrite: true,
    }

    await build(config)

    assert.equal(await fs.readFile(path.resolve(temp, 'mixed/index.mjs'), 'utf8'), `const {
  bar,
  foo,
  qux,
  default: __default__
} = require('./index.js')
export {
  bar,
  foo,
  qux
}
export default __default__
`
)
  })
})
