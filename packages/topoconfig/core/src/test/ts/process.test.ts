import * as assert from 'node:assert'
import { describe, it } from 'node:test'

import {process} from '../../main/ts/process'
import {TProcessContext} from '../../main/ts/interface'

describe('process()', () => {
  it('processes the TProcessContext', async () => {
    const ctx: TProcessContext = {
      pipelines: {
        '': [{
          cmd:  '_',
          args: ['{"b":"$b.1"}'],
          injects: {'$b.1': {raw: '$b.1', ref: 'b', path: '1' }},
          mappings: {b: 'b'}
        }],
        'a':[{
          cmd: 'upper',
          args: ['bAr'],
          injects: {},
          mappings: {}
        }],
        'b': [{
          cmd:'_',
          args: ['$a.'],
          injects: {$a: {raw: '$a', ref: 'a', path: '.'}},
          mappings: {a: 'b:a'}}],
        'b:a': [{
          cmd: 'baz',
          args: ['$c'],
          injects: {$c: {raw: '$c', ref: 'c', path: '.'}},
          mappings: {c: 'c'}
        }],
        'c': [{
          cmd: 'echo',
          args: ['$a'],
          injects: {$a: {raw: '$a', ref: 'a', path: '.'}},
          mappings: {a: 'a'}
        }]
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
        _: (...v) => {
          const _v = v.join('')
          return (_v.startsWith('{') || _v.startsWith('[')) ? JSON.parse(_v) : _v
        },
      },
      values: {}
    }

    const data = await process(ctx)
    assert.equal(data.b, 'A')
  })
})
