import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { ip } from '../../main/ts'

describe('ip()', () => {
  it('returns current ip', () => {
    assert.match(ip(), /^(?:\d+\.){3}\d+$/)
  })
})
