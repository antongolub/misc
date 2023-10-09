import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { topoconfig } from '../../main/ts/topoconfig'

describe('topoconfig()', () => {
  it('works', async () => {
    const config = await topoconfig({
      data: '$a.b.c',
      sources: {
        a: {
          data: {
            b: {
              c: 'd'
            }
          }
        }
      }
    })

    assert.equal(config, 'd')
  })
})
