import * as assert from 'node:assert'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { describe, it } from 'node:test'
import {fileURLToPath} from 'node:url'

import {type BuildOptions, build} from 'esbuild'
import { entryChunksPlugin } from '../../main/ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')
const temp = path.resolve(__dirname, '../temp')

describe('plugin()', () => {
  it('throws if bundle is false', async () => {
    const plugin = entryChunksPlugin()
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

  it('assembles entries as chunks', async () => {
    const plugin = entryChunksPlugin()
    const cwd = fixtures
    const config: BuildOptions = {
      entryPoints: [
        'a.ts',
        'b.ts',
        'c.ts',
      ],
      plugins: [plugin],
      external: ['node:*'],
      bundle: true,
      minify: false,
      sourcemap: false,
      format: 'esm',
      legalComments: 'none',
      absWorkingDir: cwd,
      outdir: temp,
      allowOverwrite: true,
    }

    await build(config)

    const a = await fs.readFile(path.join(temp, 'a.js'), 'utf8')
    const b = await fs.readFile(path.join(temp, 'b.js'), 'utf8')
    const c = await fs.readFile(path.join(temp, 'c.js'), 'utf8')

    assert.equal(a, `// a.ts
export * from "./b.js";
var a = "a";
export {
  a
};
`)

    assert.equal(b, `// b.ts
export * from "./c.js";
var b = "b";
export {
  b
};
`)
    assert.equal(c, `// e.ts
import * as fs from "node:fs";
var e = "e";
var rf = fs.readFile;

// d.ts
var d = "d";

// c.ts
var c = "c";
export {
  c,
  d,
  e,
  rf
};
`)

  })
})
