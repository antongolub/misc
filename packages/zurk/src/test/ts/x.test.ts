import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { $ } from '../../main/ts/x.js'

describe('$()', () => {
  it('supports literal api', async () => {
    const result = $`echo "5\\n3\\n1\\n4\\n2"`
    console.log('result=', result)
    const piped1 = result.pipe`sort`
    const piped2 = (await result).pipe`sort`
    // const piped3 = result.pipe($`sort`)

    console.log((await piped1).toString().trim())
    console.log((await piped2).toString().trim())
  })
})