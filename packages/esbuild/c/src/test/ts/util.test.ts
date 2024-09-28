import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {
  objectToCamelCase,
  omitUndefinedKeys,
  splitNth,
  toCamelCase
} from '../../main/ts/util'

describe('splitNth()', () => {
  it('splits string', () => {
    /* eslint-disable */
    const cases: [string, string, number, [string, string]][] = [
      ['foo:bar:baz', ':', 0, ['foo:bar:baz', '']],
      ['foo:bar:baz', ':', 1, ['foo', 'bar:baz']],
      ['foo:bar:baz', ':', 2, ['foo:bar', 'baz']],
      ['foo:bar:baz', ':', 3, ['foo:bar:baz', '']],
      ['foo:bar:baz', '_', 0, ['foo:bar:baz', '']],
    ]
    /* eslint-enable */

    cases.forEach(([str, sep, n, expected]) => {
      const actual = splitNth(str, sep, n)
      assert.deepEqual(actual, expected)
    })
  })
})

describe('toCamelCase()', () => {
  it('converts kebab string to camel case', () => {
    const cases = [
      ['foo-bar-baz', 'fooBarBaz'],
      ['foo_bar', 'foo_bar'],
      ['fooBar', 'fooBar'],
    ]

    cases.forEach(([input, output]) => {
      assert.deepEqual(toCamelCase(input), output)
    })
  })
})

describe('objectToCamelCase()', () => {
  it('converts object keys to camel case', () => {
    const cases = [
      [{ 'foo-bar': 'baz' }, { fooBar: 'baz' }],
      [{ 'foo-bar': 'baz', 'qux-quux': 'corge' }, { fooBar: 'baz', quxQuux: 'corge' }],
    ]

    cases.forEach(([input, output]) =>
      assert.deepEqual(objectToCamelCase(input), output)
    )
  })
})

describe('omitUndefinedKeys()', () => {
  const cases = [
    [{ foo: 'bar', baz: undefined }, { foo: 'bar' }],
    [{ foo: 'bar', baz: null }, { foo: 'bar', baz: null }],
  ]

  cases.forEach(([input, output]) =>
    assert.deepEqual(omitUndefinedKeys(input), output)
  )
})
