import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {invoke, TSpawnCtx, TSpawnResult} from '../../main/ts/spawn'
import {makeDeferred} from '../../main/ts/util'

describe('invoke()', () => {
  it('calls a given cmd', async () => {
    const results = []
    const callback: TSpawnCtx['callback'] = (_err, result) => results.push(result.stdout)
    const {promise, resolve, reject} = makeDeferred<TSpawnResult>()

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
})
