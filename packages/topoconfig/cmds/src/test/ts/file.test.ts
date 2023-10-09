import assert from 'node:assert'
import { describe, it } from 'node:test'
import url from 'node:url'
import { file } from '../../main/ts'

describe('file()', () => {
  it('reads file contest', async () => {
    const selfname = url.fileURLToPath(import.meta.url)
    const contents: string = await file(selfname)

    assert.ok(contents.startsWith('import assert'))
  })
})
