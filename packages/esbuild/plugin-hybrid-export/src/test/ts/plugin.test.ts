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

    assert.equal(await fs.readFile(path.resolve(temp, 'mixed/index.mjs'), 'utf8'), `"use strict";
const __module__ = require("./index.js")
const {
  bar,
  foo,
  qux,
  default: __default__
} = __module__
export {
  bar,
  foo,
  qux
}
export default __default__
`
)
  })

  it('generates esm files via reexport', async () => {
    const cwd = path.resolve(fixtures, 'mixed-exports')
    const plugin = hybridExportPlugin({
      to: '../../temp/mixed',
      toExt: '.mjs',
      loader: 'reexport'
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

    assert.equal(await fs.readFile(path.resolve(temp, 'mixed/index.mjs'), 'utf8'), `"use strict";
import * as __module__ from "./index.js"
const {
  bar,
  foo,
  qux,
  default: __default__
} = __module__
export {
  bar,
  foo,
  qux
}
export default __default__
`
    )
  })

  it('generates esm files (full reexport case)', async () => {
    const cwd = path.resolve(fixtures, 'full-reexport')
    const plugin = hybridExportPlugin({
      to: '../../temp/reexport',
      toExt: '.mjs',
      loader: 'import'
    })
    const config: BuildOptions = {
      entryPoints: [
        'index.ts',
        'foo.ts',
        'baz.ts'
      ],
      plugins: [plugin],
      platform: 'node',
      bundle: false,
      minify: false,
      sourcemap: false,
      format: 'cjs',
      legalComments: 'none',
      absWorkingDir: cwd,
      outdir: path.resolve(temp, 'reexport'),
      allowOverwrite: true,
    }

    await build(config)

    assert.equal(await fs.readFile(path.resolve(temp, 'reexport/index.mjs'), 'utf8'), `#!/usr/bin/env node
"use strict";
const __module__ = await import("./index.js")
const {
  a,
  baz,
  bar,
  foo,
  default: __default__
} = __module__
export {
  a,
  baz,
  bar,
  foo
}
export default __default__
`
    )
  })

  it('requires `format: cjs`', async () => {
    const plugin = hybridExportPlugin()
    const config: BuildOptions = {
      format: 'esm',
      plugins: [plugin],
    }
    let error: Error | undefined
    try {
      await build(config)
    } catch (err) {
      error = err
    }
    assert.ok(error.message.endsWith('esbuild-plugin-hybrid-export requires `format: cjs`'))
  })
})
