import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import path from 'node:path'
import {fileURLToPath} from 'node:url'
import { depshot } from '../../main/ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('depshot()', () => {
  it('builds dep snapshot', () => {
    assert.equal(depshot(), undefined)
  })
})
