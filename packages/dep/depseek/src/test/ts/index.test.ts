import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { depseek, depseekSync } from '../../main/ts'

describe('index', () => {
  it('has proper exports', () => {
    assert.strictEqual(typeof depseek, 'function')
    assert.strictEqual(typeof depseekSync, 'function')
  })
})
