import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { dtsFix } from '../../main/ts'

describe('foo()', () => {
  it('is callable', () => {
    assert.equal(dtsFix(), undefined)
  })
})
