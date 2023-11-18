import assert from 'node:assert'
import { describe, it } from 'node:test'
import { parse } from 'lcov-utils'

describe('mjs parse()', () => {
  it('is a function', () => {
    assert.equal(typeof parse, 'function')
  })
})
