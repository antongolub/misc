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

  it('`merge` joins array inputs', () => {
    const sources = [
      {a: [1]},
      {a: ['a'], b: 'b'},
      {a: [{foo: 'bar'}], c: 'c'},
    ]
    const result = extend({sources, rules: {
        a: 'merge',
      }})

    assert.deepEqual(result, {
      a: [1, 'a', {foo: 'bar'}],
      b: 'b',
      c: 'c'
    })
  })

  it('`override` replaces array ref', () => {
    const sources = [
      {a: [1]},
      {a: ['a'], b: 'b'},
      {a: [{foo: 'bar'}, {baz: 'qux'}], c: 'c'},
    ]
    const result = extend({sources, rules: {
      a: 'override',
    }})

    assert.deepEqual(result, {
      a: [{foo: 'bar'}, {baz: 'qux'}],
      b: 'b',
      c: 'c'
    })
  })

  it('`override` replaces array ref at root level too', () => {
    const sources = [
      [1],
      ['a'],
      [{foo: 'bar'}, {baz: 'qux'}],
    ]
    const result = extend({sources, rules: {
      '*': 'override',
    }})

    assert.deepEqual(result, [
      {foo: 'bar'}, {baz: 'qux'}
    ])
  })
})
