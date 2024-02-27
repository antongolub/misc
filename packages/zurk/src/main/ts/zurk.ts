import {invoke, TSpawnResult, readableFrom} from './spawn.js'

export const zurk = (...chunks: string[]): Promise<ZurkResponse> => new Proxy(new Promise<ZurkResponse>((resolve, reject) => {
  const ctx = invoke({
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

    return target.then(v => Reflect.get(v, p, receiver))
  }
})

export class ZurkResponse implements TSpawnResult {
  error = null
  _stderr =  ''
  _stdout =  ''
  stderr = readableFrom('')
  stdout = readableFrom('')
  status = null
  signal = null
  duration = 0
  constructor(result: TSpawnResult) {
    Object.assign(this, result)
  }
}
