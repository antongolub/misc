import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { $ } from '../../main/ts/x.js'

describe('$()', () => {
  it('handles promises in cmd literal', async () => {
    const example = $`echo example`

    // eslint-disable-next-line sonarjs/no-nested-template-literals
    assert.equal((await $`echo ${example} ${$`echo and`} ${await example}`)
      .toString(), 'example and example')
  })

  describe('pipe', () => {
    it('supports async flow', async () => {
      const result = $`echo "5\\n3\\n1\\n4\\n2"`
      const expected = '1\n2\n3\n4\n5'

      const piped0 = result.pipe`sort | cat`
      const piped1 = result.pipe`sort`.pipe`cat`
      const piped2 = (await result).pipe`sort`
      const piped3 = result.pipe($`sort`)

      assert.equal((await piped0).toString().trim(), expected)
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
