import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { cwd } from '../../main/ts'

describe('cwd()', () => {
  it('returns current cwd', () => {
    assert.equal(cwd(), process.cwd())
  })
})
