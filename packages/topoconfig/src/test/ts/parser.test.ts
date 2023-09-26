import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {parseDirective, parseRefs} from '../../main/ts'
import {TDirective} from '../../main/ts/interface'

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
            args: [
              'a',
              'b',
              'c'
            ],
            refs: []
          },
          {
            provider: 'bar',
            args: [],
            refs: []
          },
          {
            provider: 'baz',
            args: [
              'qux'
            ],
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
            args: [
              '{{? $name }}',
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
            refs: [
              'name',
              'name',
              'age',
              'age'
            ]
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
      assert.deepEqual(parseDirective(input), result))
  })
})
