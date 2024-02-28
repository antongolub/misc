import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { zurk } from '../../main/ts/zurk.js'

describe('zurk()', () => {
  it('parses template literal', async () => {
    const result = zurk({
      sync: true,
      cmd: 'echo',
      args: ['foo'],
    })

    console.log(await result.stdout, await result.duration)
    // assert.equal(zurk('echo', 'foo'), undefined)
  })
})
