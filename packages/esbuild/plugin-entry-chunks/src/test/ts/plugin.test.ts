import * as assert from 'node:assert'
import * as path from 'node:path'
import { describe, it } from 'node:test'
import {fileURLToPath} from 'node:url'

import {type BuildOptions, build} from 'esbuild'
import { entryChunksPlugin } from '../../main/ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
// const fixtures = path.resolve(__dirname, '../fixtures')

describe('plugin()', () => {
  it('assembles entries as chunks', async () => {
    const plugin = entryChunksPlugin()
    const cwd = path.resolve(__dirname, '../../..')
    console.log('cwd', cwd)

    const config: BuildOptions = {
      entryPoints: [
        './src/main/ts/index.ts',
        './src/main/ts/plugin.ts',
      ],
      plugins: [plugin],
      external: ['node:*'],
      bundle: true,
      minify: false,
      sourcemap: false,
      format: 'esm',
      legalComments: 'none',
      absWorkingDir: cwd,
      outdir: './dist',
    }

    await build(config)
  })
})
