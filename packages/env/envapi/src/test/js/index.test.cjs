const assert = require('node:assert')
const { describe, it } = require('node:test')
const { parse } = require('envapi')

describe('cjs index', () => {
  it('exports', () => {
    assert.equal(typeof parse, 'function')
  })
})
