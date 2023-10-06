import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { topoconfig } from 'topoconfig'
import * as cmds from '../../main/ts'

console.log('cmds=', cmds)

describe('integration', () => {
  it('applies everything at once', async () => {
    const config = await topoconfig<ReturnType<typeof cmds.conf>>({
      cmds,
      data: '$output',
      sources: {
        output: 'conf $raw $schema',
        raw: {
          data: {foo: {bar: 'baz'}},
          sources: {}
        },
        schema: {
          data: {
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
          },
          sources: {}
        },
      }
    })

    console.log('config=', config)
    assert.equal(config.get('foo.bar'), 'baz')
  })
})
