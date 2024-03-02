import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { $ } from '../../main/ts/x.js'

describe('$()', () => {
  describe('pipe', () => {
    it('supports async flow', async () => {
      const result = $`echo "5\\n3\\n1\\n4\\n2"`
      const expected = '1\n2\n3\n4\n5'

      const piped1 = result.pipe`sort`
      const piped2 = (await result).pipe`sort`
      const piped3 = result.pipe($`sort`)

      assert.equal((await piped1).toString().trim(), expected)
      assert.equal((await piped2).toString().trim(), expected)
      assert.equal((await piped3).toString().trim(), expected)
    })

    it('supports sync flow', async () => {
      const result = $({sync: true})`echo "5\\n3\\n1\\n4\\n2"`
      assert.equal(result.toString().trim(), '5\n3\n1\n4\n2')

      const expected = '1\n2\n3\n4\n5'
      const piped = result.pipe`sort`

      assert.equal(piped.toString().trim(), expected)
    })
  })
})
