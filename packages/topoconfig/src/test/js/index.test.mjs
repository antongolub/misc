import assert from 'node:assert'
import { describe, it } from 'node:test'
import { topoconfig } from 'topoconfig'

describe('mjs topoconfig()', () => {
  it('is exported', () => {
    assert.equal(typeof topoconfig, 'function')
  })
})
