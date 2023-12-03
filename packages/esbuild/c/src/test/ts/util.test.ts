import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {extend} from '../../main/ts/util'

describe('extend', () => {
  it('applies default (override) strategy', () => {
    const sources = [
      {a: 'a'},
      {b: 'b', a: 'A'}
    ]
    const result = extend({sources})

    assert.deepEqual(result, {
      a: 'A',
      b: 'b'
    })
  })

  it('applies `merge` strategy', () => {
    const sources = [
      {a: {b: {foo: 'foo'}}},
      {a: {b: {bar: 'bar'}, c: 'c'}},
      {a: {b: {baz: 'baz'}, c: 'C'}},
    ]
    const result = extend({sources, rules: {
      a: 'merge',
      'a.b': 'merge'
    }})

    assert.deepEqual(result, {
      a: {
        b: {
          foo: 'foo',
          bar: 'bar',
          baz: 'baz'
        },
        c: 'C'
      }
    })
  })
})
