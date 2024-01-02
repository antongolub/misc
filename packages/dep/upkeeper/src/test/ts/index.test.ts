import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { upkeeper } from '../../main/ts/index'

describe('upkeeper()', () => {
  it('generates proposals and scripts', async () => {
    const config = {
      keepers: [
        'npm'
      ],
      pre: 'echo "pre"',
      post: 'echo "post"',
      combine: true,
      dryrun: true
    }
    const {scripts, proposals} = await upkeeper(config)
    assert.ok(scripts.find(({name}) => name === 'upkeeper.sh'))
    // console.log(scripts, proposals)
  })
})
