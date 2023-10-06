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
import {DATA} from '../../main/ts/constants'

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

describe('parse()', () => {
  it('parses config declaration', () => {
    const cases: [TConfigDeclaration, TConfigGraph][] = [
      [
        {
          data: {
            b: '$b',
          },
          sources: {
            a: 'foo bar',
            b: {
              data: '$a',
              sources: {
                // $a overrides the $a source ref for the local context
                // $c does belong to the root scope
                a: 'baz $c'
              }
            },
            c: 'echo $a'
          }
        },
        {
          vertexes: {
            '':    [{cmd:  DATA,  args: ['b', '$b'], refs: ['b'],   mappings: {b: 'b'}}],
            'a':   [{cmd: 'foo',  args: ['bar'],     refs: [],      mappings: {}}],
            'b':   [{cmd:  DATA,  args: ['$a'],      refs: ['a'],   mappings: {a: 'b:a'}}],
            'b:a': [{cmd: 'baz',  args: ['$c'],      refs: ['c'],   mappings: {c: 'c'}}],
            'c':   [{cmd: 'echo', args: ['$a'],      refs: ['a'],   mappings: {a: 'a'}}]
          },
          edges: [
            ['b',''],
            ['b:a','b'],
            ['c','b:a'],
            ['a','c']
          ]
        }
      ],
      [
        {
          data: '$foo',
          sources: {
            a: 'file ./a.json > json',
            b: 'fetch https://example.com > get .body > json',
            foo: 'bar $a $b'
          }
        },
        {
          vertexes: {
            '':[
              {
                cmd: DATA,
                args: ['$foo'],
                refs: ['foo'],
                mappings: { foo: 'foo' }
              }
            ],
            a: [
              {
                cmd: 'file',
                args: ['./a.json'],
                refs: [],
                mappings: {}
              },
              {
                cmd: 'json',
                args: [],
                refs: [],
                mappings: {}
              }
            ],
            b: [
              {
                cmd: 'fetch',
                args: ['https://example.com'],
                refs: [],
                mappings: {}
              },
              {
                cmd: 'get',
                args: ['.body'],
                refs: [],
                mappings: {},
              },
              {
                cmd: 'json',
                args: [],
                refs: [],
                mappings: {},
              }
            ],
            foo: [
              {
                args: ['$a', '$b'],
                cmd: 'bar',
                refs: ['a', 'b'],
                mappings: {a: 'a', b: 'b'},
              }
            ]
          },
          edges: [
            ['foo', ''],
            ['a', 'foo'],
            ['b', 'foo']
          ]
        }
      ]
    ]

    cases.forEach(([input, output]) =>
      // {
      //   console.log('1>', JSON.stringify(parse(input)))
      //   console.log('2>', JSON.stringify(output))
      // })
      assert.deepEqual(parse(input), output))
  })
})

describe('parseRefs()', () => {
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

describe('parseDirective()', () => {
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
        'foo \'quoted statement\' param',
        [
          {
            cmd: 'foo',
            args: ['\'quoted statement\'', 'param'],
            refs: [],
            mappings: {},
          }
        ]
      ],
      [
        `mixed "quoted statement" param 'quoted "inner"' "deep \\"nested\\""`,
        [
          {
            cmd: 'mixed',
            args: ['"quoted statement"', 'param', '\'quoted "inner"\'', '"deep \\"nested\\""'],
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
            args: [
              '{{? $name }}\n<div>Oh,',
              'I',
              'love',
              'your',
              'name,',
              '{{=$name}}!</div>\n{{?? $age === 0}}\n<div>Guess',
              'nobody',
              'named',
              'you',
              'yet!</div>\n{{??}}\nYou',
              'are',
              '{{=$age}}',
              'and',
              'still',
              "don't",
              'have',
              'a',
              'name?\n{{?}}'
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
