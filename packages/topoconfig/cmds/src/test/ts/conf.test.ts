import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { conf } from '../../main/ts'

describe('conf()', () => {
  it('wraps config with Conf API', () => {
    const schema = {
      foo: {
        type: 'object',
        properties: {
          bar: {
            type: 'string'
          },
          baz: {
            type: 'string'
          }
        }
      }
    }
    const config = conf({foo: {bar: 'baz'}}, schema)

    assert.equal(config.get('foo.bar'), 'baz')
    assert.equal(config.get('foo.bar.not-found'), undefined)

    assert.throws(() => config.set('foo.baz', 1), {
      name: 'Error',
      message: 'Config schema violation: `foo/baz` must be string'
    })

    config.set('foo.baz', 'qux')
    assert.equal(config.get('foo.baz'), 'qux')
  })
})
