import * as assert from 'node:assert'
import * as path from 'node:path'
import { describe, it } from 'node:test'
import {fileURLToPath} from 'node:url'

import {type BuildOptions, build} from 'esbuild'
import { entryChunksPlugin } from '../../main/ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')
const temp = path.resolve(__dirname, '../temp')

describe('plugin()', () => {
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
  })
})
