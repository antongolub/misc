import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { http } from '../../main/ts'

describe('http()', () => {
  it('fetches data from the remote', async () => {
    const result = await http('https://dummyjson.com/products')
    const data = JSON.parse(result.body)

    assert.equal(data.products[0].title, 'iPhone 9')
  })
})
