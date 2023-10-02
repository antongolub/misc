const assert = require('node:assert')
const { describe, it } = require('node:test')
const { topoconfig } = require('topoconfig')

describe('cjs topoconfig()', () => {
  it('is exported', () => {
    assert.equal(typeof topoconfig, 'function')
  })
})
