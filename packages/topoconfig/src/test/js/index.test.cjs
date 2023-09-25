const assert = require('node:assert')
const { describe, it } = require('node:test')
const { foo } = require('topoconfig')

describe('cjs foo()', () => {
  it('is callable', () => {
    assert.equal(foo(), undefined)
  })
})
