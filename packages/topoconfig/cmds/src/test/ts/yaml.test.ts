import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { yaml } from '../../main/ts/index.ts'

describe('yaml()', () => {
  it('parses string as yaml', () => {
    assert.deepEqual(yaml('foo: bar'), {foo: 'bar'})
  })
})
