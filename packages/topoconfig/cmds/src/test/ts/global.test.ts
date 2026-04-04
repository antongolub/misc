import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { g } from '../../main/ts/index.ts'

describe('g()', () => {
  it('returns a ref to global object', () => {
    assert.equal(g(), global)
  })
})
