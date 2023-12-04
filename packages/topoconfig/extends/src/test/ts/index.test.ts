import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { populate, extend } from '../../main/ts'

describe('index', () => {
  it('exports API', () => {
    assert.equal(typeof populate, 'function')
    assert.equal(typeof extend, 'function')
  })
})
