import * as assert from 'node:assert'
import * as path from 'node:path'
import * as fs from 'node:fs'
import * as os from 'node:os'
import { describe, it } from 'node:test'
import { xtends } from '../../main/ts'

const tempy = () => fs.mkdtempSync(path.join(os.tmpdir(), 'tempy-'))

describe('xtends()', () => {
  it('populates `extends` refs in config', async () => {
    const cwd = tempy()
    await fs.promises.writeFile(path.resolve(cwd, 'config.json'), '{"foo": "bar", "extends": "./base.json"}', 'utf8')
    await fs.promises.writeFile(path.resolve(cwd, 'base.json'), '{"baz": "qux"}', 'utf8')

    const result = await xtends(path.resolve(cwd, 'config.json'))
    assert.deepEqual(result, { foo: 'bar', baz: 'qux' })
  })
})
