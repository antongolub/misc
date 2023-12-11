import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {
  upkeeper
} from '../../main/ts'

describe('upkeeper()', () => {
  it('generates proposals and scripts', async () => {
    const config = {
      keepers: [
        'npm'
      ],
      pre: 'echo "pre"',
      post: 'echo "post"',
      combine: true,
      dryrun: true,
      output: 'patches'
    }
    const {scripts, proposals} = await upkeeper(config)
    assert.ok(scripts['upkeeper.sh'])
    console.log(scripts, proposals)
  })
})
