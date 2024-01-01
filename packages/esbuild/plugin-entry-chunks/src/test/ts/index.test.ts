import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { entryChunksPlugin } from '../../main/ts'

describe('entryChunksPlugin()', () => {
  it('is a plugin factory', () => {
    const plugin = entryChunksPlugin()
    assert.equal(plugin.name, 'entry-chunks')
    assert.equal(typeof plugin.setup, 'function')
  })
})
