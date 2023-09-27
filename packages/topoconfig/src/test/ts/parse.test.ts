import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {parse, parseDirectives, parseRefs} from '../../main/ts/parse'
import {TConfigDeclaration, TConfigGraph, TDirective} from '../../main/ts/interface'

describe('parse()', () => {
  it('parses config declaration', () => {
    const cases: [TConfigDeclaration, TConfigGraph][] = [
      [
        {
          data: {
            a: '$a',
            b: '$b',
            c: '$c'
          },
          sources: {
            a: 'foo bar',
            b: {
              data: '$a',
              sources: {
                a: 'foo $c'
              }
            },
            c: 'echo $a'
          }
        },
        {
          vertexes: {},
          edges: []
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
            a: [
              {
                provider: 'file',
                args: ['./a.json'],
                refs: []
              },
              {
                provider: 'json',
                args: [],
                refs: []
              }
            ],
            b: [
              {
                provider: 'fetch',
                args: ['https://example.com'],
                refs: []
              },
              {
                provider: 'get',
                args: ['.body'],
                refs: []
              },
              {
                provider: 'json',
                args: [],
                refs: []
              }
            ],
            foo: [
              {
                args: ['$a', '$b'],
                provider: 'bar',
                refs: ['a', 'b']
              }
            ]
          },
          edges: [
            ['a', 'foo'],
            ['b', 'foo']
          ]
        }
      ]
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
            provider: 'foo',
            args: [],
            refs: []
          }
        ]
      ],
      [
        'foo a b c > bar > baz qux',
        [
          {
            provider: 'foo',
            args: ['a', 'b', 'c'],
            refs: []
          },
          {
            provider: 'bar',
            args: [],
            refs: []
          },
          {
            provider: 'baz',
            args: ['qux'],
            refs: []
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
            provider: 'dot',
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
            refs: ['name', 'name', 'age', 'age']
          },
          {
            provider: 'assert',
            args: ['$foo'],
            refs: ['foo']
          }
        ]
      ]
    ]

    cases.forEach(([input, result]) =>
      assert.deepEqual(parseDirectives(input), result))
  })
})
