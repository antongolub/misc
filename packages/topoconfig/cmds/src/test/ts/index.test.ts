import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import * as cmds from '../../main/ts'

describe('index', () => {
  it('exports cmds as expected', () => {
    const names = [
      'get'
    ];

    names.forEach(name => assert.equal(typeof cmds[name], 'function'))
  })
})
