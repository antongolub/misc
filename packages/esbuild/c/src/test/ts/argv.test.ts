import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { parseArgv } from '../../main/ts/argv.ts'

describe('parseArgv()', () => {
  it('parses argv', () => {
    const argv = ['--foo', 'bar', '--foo=baz', '--foo:qux:quux', '--foo={"a": "a"}']
    const expected = {
      _: [],
      foo: [
        'bar',
        'baz',
        'qux:quux',
        '{"a": "a"}'
      ]
    }
    const actual = parseArgv(argv)
    assert.deepEqual(actual, expected)
  })
})
