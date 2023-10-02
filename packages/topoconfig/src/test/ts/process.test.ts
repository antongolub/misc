import * as assert from 'node:assert'
import { describe, it } from 'node:test'

import {process, TProcessContext} from '../../main/ts/process'

describe('process()', () => {
  it('processes the TProcessContext', async () => {
    const ctx: TProcessContext = {
      vertexes: {
        '':    [{cmd:  '_',    args: ['{"b":"$b.1"}'], refs: ['b'],  mappings: {b: 'b'}}],
        'a':   [{cmd: 'upper', args: ['bAr'],     refs: [],      mappings: {}}],
        'b':   [{cmd:  '_',    args: ['$a'],      refs: ['a'],   mappings: {a: 'b:a'}}],
        'b:a': [{cmd: 'baz',   args: ['$c'],      refs: ['c'],   mappings: {c: 'c'}}],
        'c':   [{cmd: 'echo',  args: ['$a'],      refs: ['a'],   mappings: {a: 'a'}}]
      },
      edges: [
        ['b',''],
        ['b:a','b'],
        ['c','b:a'],
        ['a','c']
      ],
      cmds: {
        upper: v => v.toUpperCase(),
        lower: v => v.toLowerCase(),
        echo: v => v,
        baz: v => (v + 'baz'),
        _: (v) => typeof v === 'string' && (v.startsWith('{') || v.startsWith('[')) ? JSON.parse(v) : v,
      },
      values: {}
    }

    const data = await process(ctx)
    assert.equal(data.b, 'A')
  })
})