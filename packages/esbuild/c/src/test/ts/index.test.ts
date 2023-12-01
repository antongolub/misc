import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { loadConfig } from '../../main/ts'

describe('loadConfig()', () => {
  it('is callable', () => {
    assert.equal(typeof loadConfig, 'function')
  })
})
