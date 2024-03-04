import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { invoke, zurk } from '../../main/ts'

describe('index', () => {
  it('has proper exports', () => {
    assert.equal(typeof zurk, 'function')
    assert.equal(typeof invoke, 'function')
  })
})