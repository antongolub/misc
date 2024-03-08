import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { zurk, isZurk, isZurkPromise } from '../../main/ts/zurk.js'

describe('zurk()', () => {
  it('sync returns Zurk instance', async () => {
    const result = zurk({ sync: true, cmd: 'echo', args: ['foo']})
    assert.equal(result.toString(), 'foo')
    assert.equal(result.stdout, 'foo\n')
    assert.ok(isZurk(result))
  })

  it('async returns ZurkPromise', async () => {
    const result = zurk({ sync: false, cmd: 'echo', args: ['foo']})
    assert.equal((await result).toString(), 'foo')
    assert.equal((await result).stdout, 'foo\n')
    assert.equal(await result.stdout, 'foo\n')
    assert.ok(isZurkPromise(result))
    assert.ok(isZurk(await result))
  })
})
