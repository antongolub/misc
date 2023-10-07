import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { dot } from '../../main/ts'

describe('dot()', () => {
  it('fetches data from the remote', async () => {
    const chunks = [
      `{{= $a > 2`,
      `? 'foo' : 'bar'}}`,
    ].map(c => c.replace('$a', '3'))
    const result = dot(...chunks)

    assert.equal(result.trim(), 'foo')
  })
})
