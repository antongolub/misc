import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { topoconfig } from 'topoconfig'
import * as cmds from '../../main/ts'
import * as url from 'node:url'

describe('integration', () => {
  it('applies everything at once', async () => {
    const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
    const config = await topoconfig<ReturnType<typeof cmds.conf>>({
      cmds,
      data: '$output',
      sources: {
        output: 'conf $config $schema',
        config: {
          data: {
            foo: {
              bar: 'baz'
            },
            remote: '$remote',
            filename: '$cwd/$filename..json',
            kubeconfigName: '$kubeconfigName',
            somefilecontents: '$somefilecontents'
          }
        },
        kubeconfigName: 'dot {{= "$env.ENVIRONMENT_PROFILE_NAME" || "kube" }}.json',
        remote: {
          data: {
            price: '$price',
            title: '$title',
            formatted: '$title - $price'
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
          }
        },
        filename: {data: 'config'},
        cwd:      {data: 'cwd'},
        env:      {data: { ENVIRONMENT_PROFILE_NAME: 'prod' }},
        dirname:  {data: __dirname},
        ext:      {data: 'ts'},
        encoding: {data: 'utf8'},
        somefilecontents: 'file $dirname/it.test.$ext $encoding'
      }
    })

    // console.log('config=', config)
    assert.equal(config.get('foo.bar'), 'baz')
    assert.equal(config.get('remote.title'), 'iPhone 9')
    assert.equal(config.get('remote.price'), 549)
    assert.equal(config.get('remote.formatted'), 'iPhone 9 - 549')
    assert.equal(config.get('filename'), 'cwd/config.json')
    assert.equal(config.get('kubeconfigName'), 'prod.json')
    assert.ok(config.get('somefilecontents').startsWith('import * as assert'))
  })
})
