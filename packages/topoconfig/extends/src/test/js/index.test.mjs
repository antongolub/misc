import assert from 'node:assert'
import { describe, it } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { populate } from '@topoconfig/extends'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('mjs bundle', () => {
  it('populate()works', async () => {
    assert.deepEqual(await populate({
        a: 'a',
        extends: '../fixtures/extra3.mjs'
      },
      {cwd: __dirname}), {
      a: 'a',
      baz: 'qux'
    })
  })
})
