import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {
  match,
  getProps,
  getSeed
} from '../../main/ts/util.ts'

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

describe('getProps()', () => {
  const cases: [any, (string|symbol)[]][] = [
    [{}, []],
    [{ foo: 1 }, ['foo']],
    [{ foo: 1, [Symbol.for('test')]: 'test'}, ['foo', Symbol.for('test')]],
    [[1,2,3], ['0', '1', '2']],
  ]

  for (const [input, expected] of cases) {
    it(`should return [${expected.map(v => v.toString()).join(',')}] for ${JSON.stringify(input, null)}`, () => {
      assert.deepEqual(getProps(input), expected)
    })
  }
})

describe('getSeed()', () => {
  class Foo {}
  const cases: [any, any][] = [
    [{a: 'a'}, {}],
    [[1,2,3], []],
    [new Foo(), new Foo()],
    [new Set(), undefined],
    [new Map(), undefined],
    [new Date(), undefined],
    [/re/, undefined],
    [Promise.resolve(), undefined],
    [new Proxy({}, {}), undefined],
  ]

  for (const [input, expected] of cases) {
    it(``, () => {
      assert.deepEqual(getSeed(input), expected)
    })
  }
})
