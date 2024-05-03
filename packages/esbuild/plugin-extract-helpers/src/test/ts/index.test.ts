import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import plugin, { extractHelpersPlugin } from '../../main/ts'

describe('extractHelpersPlugin()', () => {
  it('has default export', () => {
    assert.equal(plugin, extractHelpersPlugin)
  })

  it('is a plugin factory', () => {
    const plugin = extractHelpersPlugin()
    assert.equal(plugin.name, 'extract-helpers')
    assert.equal(typeof plugin.setup, 'function')
  })
})
