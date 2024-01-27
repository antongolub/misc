import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import { parseArgv, run } from '../../main/ts/cli.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')

describe('cli', () => {
  it('parseArgv()', async () => {
    const opts = await parseArgv([
      '--tsconfig', 'tsconfig.json',
      '--pkg-name', '@foo/bar'
    ])

    assert.equal(opts.pkgName, '@foo/bar')
    assert.equal(opts.compilerOptions.module, 'nodenext')
  })

  it('run()', async () => {
    await run(
      (code: number) => console.log('exit code=', code),
      {
        cwd: path.resolve(fixtures, 'name-clash'),
        strategy: 'bundle',
      }
    )
  })
})
