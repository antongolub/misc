const assert = require('node:assert')
const { describe, it } = require('node:test')
const { populate } = require('@topoconfig/extends')

describe('cjs bundle', () => {
  it('populate() works', async () => {
    assert.deepEqual(await populate({
        a: 'a',
        extends: '../fixtures/extra3.mjs'
      },
      {cwd: __dirname}), {
      a: 'a',
      baz: 'qux'
    })
  })
})
