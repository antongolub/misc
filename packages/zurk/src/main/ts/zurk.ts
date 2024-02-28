import {invoke, TSpawnCtxNormalized, TSpawnResult, VoidWritable} from './spawn.js'

// https://stackoverflow.com/questions/47423241/replace-fields-types-in-interfaces-to-promises
type Promisified<T> = {
  [K in keyof T]: T[K] extends (...args: any) => infer R ?
    (...args: Parameters<T[K]>) => Promise<R> :
    Promise<T>;
}

type ZurkPromise = Promise<ZurkResponse> & Promisified<ZurkResponse> & Pick<TSpawnCtxNormalized, 'stdout' | 'stderr'>

export const zurk = (...chunks: string[]): ZurkPromise => {
  let ctx: TSpawnCtxNormalized

  return new Proxy(new Promise<ZurkResponse>((resolve, reject) => {
    ctx = invoke({
      cmd: chunks[0],
      args: chunks.slice(1),
      callback(err, data) {
        err ? reject(err) : resolve(new ZurkResponse(data))
      }
    })
  }), {
    get(target: Promise<ZurkResponse>, p: string | symbol, receiver: any): any {
      if (p === 'then') return target.then.bind(target)
      if (p === 'catch') return target.catch.bind(target)
      if (p === 'finally') return target.finally.bind(target)

      if (p === 'stdout') return ctx.stdout
      if (p === 'stderr') return ctx.stderr

      return target.then(v => Reflect.get(v, p, receiver))
    }
  }) as ZurkPromise
}

export const zurkSync = (...chunks: string[]): ZurkResponse => {
  let response = new ZurkResponse()

  invoke({
    sync: true,
    cmd: chunks[0],
    args: chunks.slice(1),
    callback(err, data) {
      response = new ZurkResponse(data)
    }
  })

  return response as ZurkResponse
}

export class ZurkResponse implements TSpawnResult {
  error = null
  _stderr =  ''
  _stdout =  ''
  stderr = new VoidWritable()
  stdout = new VoidWritable()
  status = null
  signal = null
  duration = 0
  constructor(result?: Partial<TSpawnResult>) {
    Object.assign(this, result)
  }
}
