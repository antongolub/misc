import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { topoconfig } from '../../main/ts'

describe('foo()', () => {
  it('is callable', () => {
    assert.deepEqual(topoconfig({
      data: '',
      sources: {}
    }), {})
  })
})
