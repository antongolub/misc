import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { topoconfig } from 'topoconfig'
import * as cmds from '../../main/ts'

describe('integration', () => {
  it('applies everything at once', async () => {
    const config = await topoconfig<ReturnType<typeof cmds.conf>>({
      cmds,
      data: '$output',
      sources: {
        output: 'conf $raw $schema',
        raw: {
          data: {
            foo: {
              bar: 'baz'
            },
            remote: '$remote',
            filename: '$cwd/$filename..json'
          },
          sources: {}
        },
        remote: {
          data: {
            price: '$price',
            title: '$title'
          },
          sources: {
            res: 'http https://dummyjson.com/products/1 > get body > json',
            title: 'get $res title',
            price: 'get $res price',
          }
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
        filename: {
          data: 'config',
          sources: {}
        },
        cwd: {
          data: 'cwd',
          sources: {}
        }
      }
    })

    // console.log('config=', config)
    assert.equal(config.get('foo.bar'), 'baz')
    assert.equal(config.get('remote.title'), 'iPhone 9')
    assert.equal(config.get('remote.price'), 549)
    assert.equal(config.get('filename'), 'cwd/config.json')
  })
})
