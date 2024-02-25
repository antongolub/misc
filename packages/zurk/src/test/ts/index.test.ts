import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { zurk } from '../../main/ts'

describe('foo()', () => {
  it('is callable', () => {
    assert.equal(zurk(), undefined)
  })
})
