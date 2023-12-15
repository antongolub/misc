import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { envader } from '../../main/ts'

describe('envader', () => {
  it('set-has-get-del chain works fine', () => {
    const key = 'foo'
    const value = 'foobarbaz'.repeat(10)

    envader.set(key, value)

    const id = JSON.parse(process.env['ENVADER_INDEX'])[key]

    assert.equal(envader.has(key), true)
    assert.equal(envader.get(key), value)
    assert.equal(process.env[`${id}_0`], value)

    envader.del(key)
    assert.equal(envader.has(key),false)
    assert.equal(process.env[`${id}_0`], undefined)
  })
})
