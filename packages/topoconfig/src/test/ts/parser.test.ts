import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { parseDirective } from '../../main/ts'

describe('parseDirective()', () => {
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

    assert.deepEqual(parseDirective(`dot {{? it.name }}
<div>Oh, I love your name, {{=it.name}}!</div>
{{?? it.age === 0}}
<div>Guess nobody named you yet!</div>
{{??}}
You are {{=it.age}} and still don't have a name?
{{?}} > assert foo`), [
  {
    provider: 'dot',
    args: [
      '{{?',
      'it.name',
      '}}',
      '<div>Oh,',
      'I',
      'love',
      'your',
      'name,',
      '{{=it.name}}!</div>',
      '{{??',
      'it.age',
      '===',
      '0}}',
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
