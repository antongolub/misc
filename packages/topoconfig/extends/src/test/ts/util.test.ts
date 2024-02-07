import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { clone } from '../../main/ts/util.ts'

describe('clone()', () => {
  it('makes a copy of various objects', () => {
    const ref: any = {a: {b: {c: 'c'}}}
    ref.ref = ref
    ref.a.b.ref = ref
    const date = new Date()
    const regexp = /re/
    const symbol = Symbol('foo')
    const proxy = new Proxy({}, {})
    const cases = [
      {},
      [],
      {a: 1, b: 2, c: 3},
      1,
      "2",
      () => {/* noop */},
      {
        foo() {/* noop */}
      },
      [() => {/* noop */}, {bar() {/* noop */}}],
      ref,
      date,
      regexp,
      symbol,
      proxy,
      {
        [symbol]: 'symbol',
      }
    ]

    for (const value of cases) {
      assert.deepEqual(value, clone(value))
    }

    const strict = [
      () => {/* noop */},
      date,
      regexp,
      symbol,
      proxy,
    ]

    for (const value of strict) {
      assert.equal(value, clone(value))
    }
  })
})
