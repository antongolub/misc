import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { argv } from '../../main/ts'

describe('argv()', () => {
  it('returns minimist-parsed argv', () => {
    const result = argv()
    assert.ok(Array.isArray(result._), )

    const parsed = argv('--foo', 'bar')
    assert.equal(parsed.foo, 'bar')
  })
})
