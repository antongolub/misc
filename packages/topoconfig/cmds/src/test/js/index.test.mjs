import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import * as cmds from '@topoconfig/cmds'

describe('index (bundle)', () => {
  it('seems working', () => {
    Object.values(cmds).forEach(cmd => assert.equal(typeof cmd, 'function'))
    assert.ok(cmds.ip())
  })
})
