import * as assert from 'node:assert'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, it } from 'node:test'
import { $ } from '../../main/ts/x.js'

const __dirname = new URL('.', import.meta.url).pathname
const fixtures = path.resolve(__dirname, '../fixtures')

describe('$()', () => {
  it('supports async flow', async () => {
    const p = $`echo foo`
    const o1 = (await p).toString()
    const o2 = await p.stdout

    assert.equal(o1, 'foo')
    assert.equal(o2.trim(), 'foo')
  })

  it('supports sync flow', () => {
    const p = $({sync: true})`echo foo`
    const o1 = p.toString()
    const o2 = p.stdout

    assert.equal(o1, 'foo')
    assert.equal(o2.trim(), 'foo')
  })

  it('handles `kill`', async () => {
    const p = $`sleep 10`
    setTimeout(p.kill, 100)

    try {
      await p
      throw new Error('should have thrown')
    } catch (err) {
      assert.equal(err.message, 'Command failed with signal SIGTERM')
    }
  })

  it('handles promises in cmd literal', async () => {
    const example = $`echo example`

    // eslint-disable-next-line sonarjs/no-nested-template-literals
    assert.equal((await $`echo ${example} ${$`echo and`} ${await example}`)
      .toString(), 'example and example')
  })

  it('supports stdin', async () => {
    const input = '{"name": "foo"}'
    const name = await $({input})`jq -r .name`
    assert.equal(name.toString().trim(), 'foo')

    const stdin = fs.createReadStream(path.join(fixtures, 'foo.json'))
    const data = await $({stdin})`jq -r .data`
    assert.equal(data.toString().trim(), 'foobar')

    const p = $`echo "5\\n3\\n1\\n4\\n2"`
    const sorted = $({input: p})`sort`

    assert.equal((await sorted).toString(), '1\n2\n3\n4\n5')
  })

  describe('pipe', () => {
    it('supports async flow', async () => {
      const result = $`echo "5\\n3\\n1\\n4\\n2"`
      const expected = '1\n2\n3\n4\n5'

      const piped0 = result.pipe`sort | cat`
      const piped1 = result.pipe`sort`.pipe`cat`
      const piped2 = (await result).pipe`sort`
      const piped3 = result.pipe($`sort`)

      assert.equal((await piped0).toString(), expected)
      assert.equal((await piped1).toString(), expected)
      assert.equal((await piped2).toString(), expected)
      assert.equal((await piped3).toString(), expected)
    })

    it('supports sync flow', async () => {
      const result = $({sync: true})`echo "5\\n3\\n1\\n4\\n2"`
      assert.equal(result.toString().trim(), '5\n3\n1\n4\n2')

      const expected = '1\n2\n3\n4\n5'
      const piped = result.pipe`sort`

      assert.equal(piped.toString(), expected)
    })
  })
})
