import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import * as url from 'node:url'
import { pkg } from '../../main/ts'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

describe('pkg()', () => {
  it('reads the closes package.json', async () => {
    assert.equal((await pkg(__dirname)).name, '@topoconfig/cmds')
  })
})
