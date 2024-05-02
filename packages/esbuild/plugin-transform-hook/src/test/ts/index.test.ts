import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import plugin, { transformHookPlugin } from '../../main/ts'

describe('transformHookPlugin()', () => {
  it('has default export', () => {
    assert.equal(plugin, transformHookPlugin)
  })

  it('is a plugin factory', () => {
    const plugin = transformHookPlugin()
    assert.equal(plugin.name, 'transform-hook')
    assert.equal(typeof plugin.setup, 'function')
  })
})
