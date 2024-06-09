import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import plugin, { transformExtPlugin } from '../../main/ts'

describe('transformHookPlugin()', () => {
  it('has default export', () => {
    assert.equal(plugin, transformExtPlugin)
  })

  it('is a plugin factory', () => {
    const plugin = transformExtPlugin()
    assert.equal(plugin.name, 'transform-ext')
    assert.equal(typeof plugin.setup, 'function')
  })
})
