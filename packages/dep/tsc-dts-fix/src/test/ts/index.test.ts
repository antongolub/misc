import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { generateDts } from '../../main/ts/index.ts'

describe('index', () => {
  it('has proper exports', () => {
    assert.strictEqual(typeof generateDts, 'function')
  })
})
