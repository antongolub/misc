import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { extend, extendArray, extendObject } from '../../main/ts/extend'

describe('extend', () => {
  const cases: [string, Parameters<typeof extend>[0], any][] = [
    [
      'applies default (override) strategy',
      {
        sources: [
          {a: 'a'},
          {b: 'b', a: 'A'}
        ]
      },
      {
        a: 'A',
        b: 'b'
      }
    ],
    [
      'applies `merge` strategy to nested objects',
      {
        sources: [
          {a: {b: {foo: 'foo'}}},
          {a: {b: {bar: 'bar'}, c: 'c'}},
          {a: {b: {baz: 'baz'}, c: 'C'}},
        ],
        rules: {
          a: 'merge',
          'a.b': 'merge'
        }
      },
      {
        a: {
          b: {
            foo: 'foo',
            bar: 'bar',
            baz: 'baz'
          },
          c: 'C'
        }
      }
    ],
    [
      '`merge` joins array inputs',
      {
        sources: [
          {a: [1]},
          {a: ['a'], b: 'b'},
          {a: [{foo: 'bar'}], c: 'c'},
        ],
        rules: {
          a: 'merge',
        }
      },
      {
        a: [1, 'a', {foo: 'bar'}],
        b: 'b',
        c: 'c'
      }
    ],
    [
      '`override` replaces array refs',
      {
        sources: [
          {a: [1]},
          {a: ['a'], b: 'b'},
          {a: [{foo: 'bar'}, {baz: 'qux'}], c: 'c'},
        ],
        rules: {
          a: 'override',
        }
      },
      {
        a: [{foo: 'bar'}, {baz: 'qux'}],
        b: 'b',
        c: 'c'
      }
    ],
    [
      '`override` replaces array ref at root level too',
      {
        sources: [
          [1],
          ['a'],
          [{foo: 'bar'}, {baz: 'qux'}],
        ],
        rules: {
          '*': 'override',
        }
      },
      [
        {foo: 'bar'}, {baz: 'qux'}
      ]
    ]
  ];

  cases.forEach(([name, input, expected]) => {
    it(name, () => {
      assert.deepEqual(extend(input), expected)
    })
  })
})

describe('extendArray()', () => {
  it('applies `merge` strategy', () => {
    assert.deepEqual(extendArray({
      result: [],
      rules: {'*': 'merge'},
      sources: [[1,2], [3,4]],
      prefix: '.',
      index: {}
    }), [1,2,3,4])
  })

  it('applies `override` strategy', () => {
    assert.deepEqual(extendArray({
      result: [],
      rules: {'*': 'override'},
      sources: [[1,2], [3,4]],
      prefix: '.',
      index: {}
    }), [3,4])
  })
})
