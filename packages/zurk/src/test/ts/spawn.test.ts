import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {invoke, normalizeCtx, TSpawnCtx, TSpawnResult} from '../../main/ts/spawn'
import {makeDeferred} from '../../main/ts/util'

describe('invoke()', () => {
  it('calls a given cmd', async () => {
    const results = []
    const callback: TSpawnCtx['callback'] = (_err, result) => results.push(result._stdout)
    const { promise, resolve, reject } = makeDeferred<TSpawnResult>()

    invoke({
      sync: true,
      cmd: 'echo',
      args: ['hello'],
      callback
    })

    invoke({
      sync: false,
      cmd: 'echo',
      args: ['world'],
      callback(err, result) {
        err ? reject(err) : resolve(result)
      }
    })

    await promise.then((result) => callback(null, result))

    console.log(results)
  })

  it('supports stdin injection', async () => {
    const {promise, resolve, reject} = makeDeferred<string>()
    const input = '{"name": "world"}'
    invoke({
      sync: false,
      input,
      cmd: 'jq',
      args: ['-r', '.name'],
      callback(err, result) {
        err ? reject(err) : resolve(result._stdout)
      }
    })

    const name = await promise
    assert.equal(name.trim(), 'world')
  })
})

describe('normalizeCtx()', () => {
  it('normalizes ctx', () => {
    const cwds = ['a', 'b', 'c']
    const ctx = {
      cmd: 'foo',
      get cwd () {
        return cwds.shift() || process.cwd()
      },
    }
    const normalized = normalizeCtx(ctx)
    assert.equal(normalized.cwd, 'a')
    assert.equal(normalized.cwd, 'b')
    assert.equal(normalized.cwd, 'c')
  })
})
