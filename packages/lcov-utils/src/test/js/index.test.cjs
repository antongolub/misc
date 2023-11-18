const assert = require('node:assert')
const { describe, it } = require('node:test')
const { parse } = require('lcov-utils')

describe('cjs parse()', () => {
  it('is a function', () => {
    assert.equal(typeof parse, 'function')
  })
})
