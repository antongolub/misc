import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { topoconfig } from '../../main/ts'

describe('topoconfig()', () => {
  it('is exported', () => {
    assert.equal(typeof topoconfig, 'function')
  })
})
