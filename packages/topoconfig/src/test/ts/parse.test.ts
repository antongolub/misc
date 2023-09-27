import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {
  parse,
  parseDirectives,
  parseRefs,
  formatRefKey,
  resolveRefKey,
  TParseContext,
  parseDataRefs
} from '../../main/ts/parse'
import {TConfigDeclaration, TConfigGraph, TData, TDirective} from '../../main/ts/interface'

describe('formatRefKey()', () => {
  it('formats key str', () => {
    assert.equal(formatRefKey('foo'), 'foo')
    assert.equal(formatRefKey('foo', 'bar'), 'bar:foo')
    assert.equal(formatRefKey('foo', 'bar', '-'), 'bar-foo')
  })
})

describe('resolveRefKey', () => {
  it('assembles prefix by closest ctx matched', () => {
    const cases: [string, TParseContext, string][] = [
      [
        'foo', {
          refs: ['foo'],
          edges: [],
          vertexes: {},
          prefix: ''
        },
        'foo'
      ],
      [
        'foo',
        {
          refs: [],
          edges: [],
          vertexes: {},
          prefix: 'nested',
          parent: {
            refs: ['foo'],
            edges: [],
            vertexes: {},
            prefix: ''
          }
        },
        'foo'
      ],
      [
        'foo',
        {
          refs: ['foo'],
          edges: [],
          vertexes: {},
          prefix: 'nested-2',
          parent: {
            refs: ['foo'],
            edges: [],
            vertexes: {},
            prefix: 'nested-1',
            parent: {
              refs: ['foo'],
              edges: [],
              vertexes: {},
              prefix: ''
            }
          }
        },
        'nested-1:nested-2:foo'
      ],
    ]

    cases.forEach(([key, ctx, result]) =>
      assert.equal(resolveRefKey(key, ctx), result))
  })
})

describe('parseDataRefs()', () => {
  it('finds refs in data struct', () => {
    const cases: [TData, string[]][] = [
      ['foo', []],
      ['aaa $a $b', ['a', 'b']],
      [{
        a: {
          b: {
            c: '$a $b'
          }
        },
        d: ['   $e', { f: '$f' }]
      }, ['a', 'b', 'e', 'f']],
      [null, []]
    ]
    cases.forEach(([input, output]) =>
      assert.deepEqual(parseDataRefs(input), output))
  })
})

describe.skip('parse()', () => {
  it('parses config declaration', () => {
    const cases: [TConfigDeclaration, TConfigGraph][] = [
      [
        {
          data: {
            a: '$a',
            b: '$b',
            c: '$c',
          },
          sources: {
            a: 'foo bar',
            b: {
              data: '$a',
              sources: {
                // $a overrides the $a source ref for the local context
                // $c does belong to the root scope
                a: 'foo $c $d',
                d: 'bar ddd'
              }
            },
            c: 'echo $a'
          }
        },
        {
          vertexes: {
            'a':   [{cmd: 'foo',  args: ['bar'],     refs: [],        mappings: {}}],
            'b':   [{cmd: '_',    args: [],          refs: ['a'],     mappings: {a: 'b.a'}}],
            'b:a': [{cmd: 'foo',  args: ['$c','$d'], refs: ['c','d'], mappings: {c: 'c', d: 'b:d'}}],
            'b:d': [{cmd: 'bar',  args: ['ddd'],     refs: [],        mappings: {}}],
            'c':   [{cmd: 'echo', args: ['$a'],      refs: ['a'],     mappings: {a: 'a'}}]
          },
          edges: [
            ['c',   'b:a'],
            ['b:d', 'b:a'],
            ['b:a', 'b'],
            ['a',   'c']
          ]
        }
      ],
      // [
      //   {
      //     data: '$foo',
      //     sources: {
      //       a: 'file ./a.json > json',
      //       b: 'fetch https://example.com > get .body > json',
      //       foo: 'bar $a $b'
      //     }
      //   },
      //   {
      //     vertexes: {
      //       a: [
      //         {
      //           cmd: 'file',
      //           args: ['./a.json'],
      //           refs: [],
      //           mappings: {}
      //         },
      //         {
      //           cmd: 'json',
      //           args: [],
      //           refs: [],
      //           mappings: {}
      //         }
      //       ],
      //       b: [
      //         {
      //           cmd: 'fetch',
      //           args: ['https://example.com'],
      //           refs: [],
      //           mappings: {}
      //         },
      //         {
      //           cmd: 'get',
      //           args: ['.body'],
      //           refs: [],
      //           mappings: {},
      //         },
      //         {
      //           cmd: 'json',
      //           args: [],
      //           refs: [],
      //           mappings: {},
      //         }
      //       ],
      //       foo: [
      //         {
      //           args: ['$a', '$b'],
      //           cmd: 'bar',
      //           refs: ['a', 'b'],
      //           mappings: {},
      //         }
      //       ]
      //     },
      //     edges: [
      //       ['a', 'foo'],
      //       ['b', 'foo']
      //     ]
      //   }
      // ]
    ]

    cases.forEach(([input, output]) =>
      assert.deepEqual(parse(input), output))
  })
})

describe.skip('parseRefs()', () => {
  it('extracts refs', () => {
    const cases: [string, string[]][] = [
      ['no refs', []],
      ['$foo', ['foo']],
      ['prefix prefix$foo$bar', ['foo', 'bar']],
    ]

    cases.forEach(([input, result]) =>
      assert.deepEqual(parseRefs(input), result))
  })
})

describe.skip('parseDirective()', () => {
  it('recognizes providers', () => {
    const cases: [string, TDirective[]][] = [
      [
        'foo',
        [
          {
            cmd: 'foo',
            args: [],
            refs: [],
            mappings: {},
          }
        ]
      ],
      [
        'foo a b c > bar > baz qux',
        [
          {
            cmd: 'foo',
            args: ['a', 'b', 'c'],
            refs: [],
            mappings: {}
          },
          {
            cmd: 'bar',
            args: [],
            refs: [],
            mappings: {},
          },
          {
            cmd: 'baz',
            args: ['qux'],
            refs: [],
            mappings: {},
          }
        ]
      ],
      [
        `dot {{? $name }}
<div>Oh, I love your name, {{=$name}}!</div>
{{?? $age === 0}}
<div>Guess nobody named you yet!</div>
{{??}}
You are {{=$age}} and still don't have a name?
{{?}} > assert $foo`,
        [
          {
            cmd: 'dot',
            args: ['{{? $name }}',
              '<div>Oh,',
              'I',
              'love',
              'your',
              'name,',
              '{{=$name}}!</div>',
              '{{?? $age === 0}}',
              '<div>Guess',
              'nobody',
              'named',
              'you',
              'yet!</div>',
              '{{??}}',
              'You',
              'are',
              '{{=$age}}',
              'and',
              'still',
              "don't",
              'have',
              'a',
              'name?',
              '{{?}}'
            ],
            refs: ['name', 'name', 'age', 'age'],
            mappings: {}
          },
          {
            cmd: 'assert',
            args: ['$foo'],
            refs: ['foo'],
            mappings: {}
          }
        ]
      ]
    ]

    cases.forEach(([input, result]) =>
      assert.deepEqual(parseDirectives(input), result))
  })
})
