import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { parse, format, merge } from '../../main/ts'

describe('parse()', () => {
  it('parses lcov input', () => {
    assert.equal(parse(), undefined)
  })
})

describe('parse()', () => {
  it('formats lcov output', () => {
    assert.equal(format(), undefined)
  })
})

describe('merge()', () => {
  it('joins several lcovs', () => {
    assert.equal(merge(), undefined)
  })
})

