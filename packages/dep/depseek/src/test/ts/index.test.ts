import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { depseek, extract, readify } from '../../main/ts'

describe('index', () => {
  it('has proper exports', () => {
    assert.strictEqual(typeof depseek, 'function')
    assert.strictEqual(typeof extract, 'function')
    assert.strictEqual(typeof readify, 'function')
  })
})
