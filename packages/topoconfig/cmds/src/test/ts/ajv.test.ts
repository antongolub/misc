import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { ajv } from '../../main/ts'

describe('ajv()', () => {
  it('asserts schema to be defined', () => {
    assert.throws(() => ajv({}), {
      name: 'Error',
      message: 'ajv: schema MUST be specified'
    })
  })

  it('returns value as is if matched to the schema', () => {
    const obj = {foo: 'bar'}
    const schema = {type: 'object', properties: {foo: {type: 'string'}}}
    const result = ajv(obj, schema)

    assert.equal(ajv(obj, schema), obj)
  })

  it('raises an error otherwise', () => {
    assert.throws(() => ajv(
      {foo: 1},
      {type: 'object', properties: {foo: {type: 'string'}}}
      ), {
      name: 'Error',
      message: 'ajv: data/foo must be string'
    })
  })
})
