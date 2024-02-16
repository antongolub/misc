import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { match } from '../../main/ts/util.ts'

describe('match()', () => {
  describe('checks strings against patterns', () => {
    const cases: [string, string, boolean][] = [
      ['foo', 'foo', true],
      ['foo', 'bar', false],
      ['foo', 'f*', true],
      ['foo', 'b*', false],
      ['foo', '*', true],
      ['foo', 'f?o', true],
      ['foo', 'f?b', false],
      ['foo', '^foo$', true],
      ['foo.bar.baz', 'foo.*', false],
      ['foo.bar.baz', 'foo.**', true],
      ['foo.bar.baz', 'foo.*.baz', true],
      ['foo.bar.baz', 'foo.*.*', true],
    ]

    for (const [input, pattern, expected] of cases) {
      it(`should return ${expected} for ${input} and ${pattern}`, () => {
        assert.strictEqual(match(input, pattern), expected)
      })
    }
  })
})