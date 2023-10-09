import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { env } from '../../main/ts'

describe('ip()', () => {
  it('returns current ip', () => {
    assert.equal(env(), process.env)
  })
})
