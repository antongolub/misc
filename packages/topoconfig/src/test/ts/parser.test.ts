import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {parseDirective, parseRefs} from '../../main/ts'

describe('parseRefs()', () => {
  it('extracts refs', () => {
    const cases: [string, string[]][] = [
      ['$foo', ['foo']],
      ['prefix prefix$foo$bar', ['foo', 'bar']],
    ]

    cases.forEach(([input, result]) => {
      assert.deepEqual(parseRefs(input), result)
    })
  })
})

describe.skip('parseDirective()', () => {
  it('recognizes providers', () => {
    // assert.deepEqual(parseDirective('foo'), [{provider: 'foo', args: []}])
    // assert.deepEqual(parseDirective('foo a b c > bar > baz qux'), [
    //   {
    //     args: [
    //       'a',
    //       'b',
    //       'c'
    //     ],
    //     provider: 'foo'
    //   },
    //   {
    //     args: [],
    //     provider: 'bar'
    //   },
    //   {
    //     args: [
    //       'qux'
    //     ],
    //     provider: 'baz'
    //   }
    // ])

    assert.deepEqual(parseDirective(`dot {{? $name }}
<div>Oh, I love your name, {{=$name}}!</div>
{{?? $age === 0}}
<div>Guess nobody named you yet!</div>
{{??}}
You are {{=$age}} and still don't have a name?
{{?}} > assert $foo`), [
  {
    provider: 'dot',
    args: [
      '{{? it.name }}',
      '<div>Oh,',
      'I',
      'love',
      'your',
      'name,',
      '{{=it.name}}!</div>',
      '{{?? it.age === 0}}',
      '<div>Guess',
      'nobody',
      'named',
      'you',
      'yet!</div>',
      '{{??}}',
      'You',
      'are',
      '{{=it.age}}',
      'and',
      'still',
      "don't",
      'have',
      'a',
      'name?',
      '{{?}}'
    ]
  }, {
    provider: 'assert',
    args: ['foo']
  }])
  })
})
