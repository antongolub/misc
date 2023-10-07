import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {get} from '../../main/ts'

describe('get()', () => {
  it('extracts value by path', () => {
    assert.deepEqual(get({foo: {bar: 'baz'}}, '.'), {foo: {bar: 'baz'}})
    assert.equal(get({foo: {bar: 'baz'}}, 'foo.bar'), 'baz')
    assert.equal(get({foo: {bar: 'baz'}}, '.foo.bar'), 'baz')
    assert.equal(get({foo: {bar: 'baz'}}, '.foo.bar.'), 'baz')
    assert.equal(get({foo: [{bar: 'baz'}]}, 'foo.0.bar'), 'baz')
  })

  it('returns undefined otherwise', () => {
    assert.equal(get({foo: {bar: 'baz'}}, 'unknown.path'), undefined)
  })

  it('returns defaultValue if specified', () => {
    assert.equal(get({foo: {bar: 'baz'}}, 'unknown.path', 'qux'), 'qux')
  })
})
