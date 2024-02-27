import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { zurk } from '../../main/ts'

describe('zurk()', () => {
  it('parses template literal', async () => {
    const result = zurk('echo', 'foo')

    // _@ts-ignore
    // console.log(await result._stdout, await result.duration)
    // assert.equal(zurk('echo', 'foo'), undefined)
  })
})
