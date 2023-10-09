import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { json } from '../../main/ts'

describe('json()', () => {
  it('parses string as json', () => {
    assert.deepEqual(json('{"foo":"bar"}'), {foo: 'bar'})
  })
})
