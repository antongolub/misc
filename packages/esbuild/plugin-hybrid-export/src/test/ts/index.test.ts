import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import plugin, { hybridExportPlugin } from '../../main/ts'

describe('entryChunksPlugin()', () => {
  it('has default export', () => {
    assert.equal(plugin, hybridExportPlugin)
  })

  it('is a plugin factory', () => {
    const plugin = hybridExportPlugin()
    assert.equal(plugin.name, 'hybrid-export')
    assert.equal(typeof plugin.setup, 'function')
  })
})
