import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {
  parse,
  populate,
  populateSync,
  extend,
  loadSync,
  load,
  clone,
  resolve
} from '../../main/ts'

describe('index', () => {
  it('exports API', () => {
    assert.equal(typeof parse, 'function')
    assert.equal(typeof populate, 'function')
    assert.equal(typeof populateSync, 'function')
    assert.equal(typeof load, 'function')
    assert.equal(typeof loadSync, 'function')
    assert.equal(typeof extend, 'function')
    assert.equal(typeof clone, 'function')
    assert.equal(typeof resolve, 'function')
  })
})
