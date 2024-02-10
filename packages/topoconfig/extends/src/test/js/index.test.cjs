const assert = require('node:assert')
const { describe, it } = require('node:test')
const { populate } = require('@topoconfig/extends')

describe('cjs bundle', () => {
  it('populate() works', async () => {
    assert.deepEqual(await populate({
        a: 'a',
        extends: '../fixtures/extra6.cjs'
      },
      {cwd: __dirname}), {
      a: 'a',
      foo: 'bar',
      arr1: [3, 4],
      arr2: ["c", "d"]
    })
  })
})
