import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import _envader, { envader, get, has, set, del } from '../../main/ts'

describe('envader', () => {
  it('provides default export', () => {
    assert.equal(envader, _envader)
    assert.equal(envader.set, set)
    assert.equal(envader.get, get)
    assert.equal(envader.del, del)
    assert.equal(envader.has, has)
  })

  it('set-has-get-del chain works fine', () => {
    const key = 'foo'
    const value = 'foobarbaz'.repeat(10)

    envader.set(key, value)

    const refs = envader.refs()
    const id = JSON.parse(process.env['ENVADER_INDEX'])[key]

    assert.equal(envader.has(key), true)
    assert.equal(envader.get(key), value)
    assert.equal(envader.get('unknown'), undefined)
    assert.equal(process.env[`${id}_0`], value)

    assert.equal(refs.length, 2)
    assert.ok(refs.includes(`${id}_0`))
    assert.ok(refs.includes(`ENVADER_INDEX`))

    envader.del(key)
    assert.equal(envader.has(key),false)
    assert.equal(process.env[`${id}_0`], undefined)
    assert.equal(envader.refs().length, 1)
  })
})
