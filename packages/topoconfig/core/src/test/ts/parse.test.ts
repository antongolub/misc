import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {
  parse,
  parseDirectives,
  parseInjects,
  parseDataInjects,
  formatRefKey,
  resolveRefKey
} from '../../main/ts/parse'
import {TConfigDeclaration, TConfigGraph, TData, TDirective, TInjects, TParseContext} from '../../main/ts/interface'
import {DATA, VARARG} from '../../main/ts/constants'

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
          nodes: ['foo'],
          edges: [],
          pipelines: {},
          prefix: ''
        },
        'foo'
      ],
      [
        'foo',
        {
          nodes: [],
          edges: [],
          pipelines: {},
          prefix: 'nested',
          parent: {
            nodes: ['foo'],
            edges: [],
            pipelines: {},
            prefix: ''
          }
        },
        'foo'
      ],
      [
        'foo',
        {
          nodes: ['foo'],
          edges: [],
          pipelines: {},
          prefix: 'nested-2',
          parent: {
            nodes: ['foo'],
            edges: [],
            pipelines: {},
            prefix: 'nested-1',
            parent: {
              nodes: ['foo'],
              edges: [],
              pipelines: {},
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

describe('parseInjects()', () => {
  it('extracts injects', () => {
    const cases: [string, TInjects][] = [
      ['no refs', {}],
      ['$foo', {$foo: {raw: '$foo', path: '.', ref: 'foo'}}],
      ['prefix prefix$foo$bar.baz', {
        $foo:       {raw: '$foo', ref: 'foo', path: '.' },
        '$bar.baz': {raw: '$bar.baz', ref: 'bar', path: 'baz' },
      }],
    ]

    cases.forEach(([input, result]) =>
      assert.deepEqual(parseInjects(input), result))
  })
})

describe('parseDataInjects()', () => {
  it('finds injects in data struct', () => {
    const cases: [TData, TInjects][] = [
      [
        'foo',
        {}
      ],
      [
        'aaa $a $b',
        {
          $a: {raw: '$a', ref: 'a', path: '.'},
          $b: {raw: '$b', ref: 'b', path: '.'},
        }
      ],
      [
        {
          a: {
            b: {
              c: '$a $b'
            }
          },
          d: ['   $e', { f: '$f$g.h$i.j.k' }]
        }, {
        $a:       {raw: '$a', ref: 'a', path: '.'},
        $b:       {raw: '$b', ref: 'b', path: '.'},
        $e:       {raw: '$e', ref: 'e', path: '.'},
        $f:       {raw: '$f', ref: 'f', path: '.'},
        '$g.h':   {raw: '$g.h', ref: 'g', path: 'h'},
        '$i.j.k': {raw: '$i.j.k', ref: 'i', path: 'j.k'},
        }
      ],
      [null, {}]
    ]
    cases.forEach(([input, output]) =>
      assert.deepEqual(parseDataInjects(input), output))
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
            injects: {},
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
            injects: {},
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
            injects: {},
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
            injects: {},
            mappings: {}
          },
          {
            cmd: 'bar',
            args: [],
            injects: {},
            mappings: {},
          },
          {
            cmd: 'baz',
            args: ['qux'],
            injects: {},
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
            injects: {
              $name: {raw: '$name', ref: 'name', path: '.'},
              $age: {raw: '$age', ref: 'age', path: '.'},
            },
            mappings: {}
          },
          {
            cmd: 'assert',
            args: ['$foo'],
            injects: {
              $foo: {raw: '$foo', ref: 'foo', path: '.'},
            },
            mappings: {}
          }
        ]
      ]
    ]

    cases.forEach(([input, result]) =>
      assert.deepEqual(parseDirectives(input), result))
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
          pipelines: {
            '': [{
              cmd:  DATA,
              args: [VARARG, 'b', '$b'],
              injects: {$b: {raw: '$b', ref: 'b', path: '.'}},
              mappings: {b: 'b'}}
            ],
            'a': [{
              cmd: 'foo',
              args: ['bar'],
              injects: {},
              mappings: {}
            }],
            'b': [{
              cmd: DATA,
              args: ['$a'],
              injects: {$a: {raw: '$a', ref: 'a', path: '.'}},
              mappings: {a: 'b:a'}
            }],
            'b:a': [{
              cmd: 'baz',
              args: ['$c'],
              injects: {$c: {raw: '$c', ref: 'c', path: '.'}},
              mappings: {c: 'c'}}
            ],
            'c': [{
              cmd: 'echo',
              args: ['$a'],
              injects: {$a: {raw: '$a', ref: 'a', path: '.'}},
              mappings: {a: 'a'}
            }]
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
          pipelines: {
            '':[
              {
                cmd: DATA,
                args: ['$foo'],
                injects: {$foo: {raw: '$foo', ref: 'foo', path: '.'}},
                mappings: { foo: 'foo' }
              }
            ],
            a: [
              {
                cmd: 'file',
                args: ['./a.json'],
                injects: {},
                mappings: {}
              },
              {
                cmd: 'json',
                args: [],
                injects: {},
                mappings: {}
              }
            ],
            b: [
              {
                cmd: 'fetch',
                args: ['https://example.com'],
                injects: {},
                mappings: {}
              },
              {
                cmd: 'get',
                args: ['.body'],
                injects: {},
                mappings: {},
              },
              {
                cmd: 'json',
                args: [],
                injects: {},
                mappings: {},
              }
            ],
            foo: [
              {
                args: ['$a', '$b'],
                cmd: 'bar',
                injects: {
                  $a:       {raw: '$a', ref: 'a', path: '.'},
                  $b:       {raw: '$b', ref: 'b', path: '.'},
                },
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

