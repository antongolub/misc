import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { pkg } from '../../main/ts'

describe('pkg()', () => {
  it('reads the closes package.json', async () => {
    assert.equal((await pkg()).name, '@topoconfig/cmds')
  })
})
