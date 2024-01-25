import * as assert from 'node:assert'
import * as path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { generateDts } from '../../main/ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')

describe('libdef()', () => {
  it('joins several dts into one', () => {
    assert.deepEqual(generateDts({
      input: path.resolve(fixtures, 'name-clash/index.ts'),
      strategy: 'bundle'
    }), {})
  })
})
