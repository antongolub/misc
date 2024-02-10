import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgv, run } from '../../main/ts/cli.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')
const tempy = () => fs.mkdtempSync(path.join(os.tmpdir(), 'tempy-'))
const exit = (code: number) => console.log('exit code=', code)

describe('cli', () => {
  it('parseArgv()', async () => {
    const {config, opts} = await parseArgv([
      'tsconfig.json',
      '{"compilerOptions": "merge"}'
    ])

    assert.equal(config, 'tsconfig.json')
    assert.equal(opts.compilerOptions, 'merge')
  })

  it('run()', async () => {
    const output = path.resolve(tempy(), 'output.json')


    await run(
      [
        path.resolve(fixtures, 'extra1.json'),
        '{}',
      ],
      exit
    )
    await run(
      [
        path.resolve(fixtures, 'extra1.json'),
        '{}',
        output
      ],
      exit
    )

    const result = JSON.parse(await fs.promises.readFile(output, 'utf8'))
    assert.deepEqual(result, {
      baz: 'qux'
    })
  })
})
