import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { loadConfig, normalizeConfig, loadPlugin, parseArgv } from '../../main/ts'

describe('index', () => {
  it('exports config and argv utils', () => {
    assert.equal(typeof loadConfig, 'function')
    assert.equal(typeof normalizeConfig, 'function')
    assert.equal(typeof loadPlugin, 'function')
    assert.equal(typeof parseArgv, 'function')
  })
})
