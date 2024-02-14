import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { parse, stringify, resolve } from '../../main/ts'

describe('parse()', () => {
  const cases: [string, string, any][] = [
    [
      'case',
      'input',
      {

      }
    ]
  ]

  for (const [name, input, expected] of cases) {
    it(name, () => {
      assert.deepEqual(parse(input), expected)
    })
  }
})
