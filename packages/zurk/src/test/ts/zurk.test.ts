import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { zurk } from '../../main/ts/zurk.js'

describe('zurk()', () => {
  it('sync returns Zurk instance', async () => {
    const result = zurk({ sync: true, cmd: 'echo', args: ['foo']})
    assert.equal(result.toString(), 'foo\n')
    assert.equal(result.stdout, 'foo\n')
  })

  it('async returns ZurkPromise', async () => {
    const result = zurk({ sync: false, cmd: 'echo', args: ['foo']})
    assert.equal((await result).toString(), 'foo\n')
    assert.equal((await result).stdout, 'foo\n')
    assert.equal(await result.stdout, 'foo\n')
  })
})
