import { TSpawnCtx, TSpawnCtxNormalized, TSpawnResult, Promisified } from './interface.js'
import { invoke, normalizeCtx, VoidWritable } from './spawn.js'

export type ZurkPromise = Promise<Zurk> & Promisified<Zurk> & Pick<TSpawnCtxNormalized, 'stdout' | 'stderr'>

export type TZurkOptions = Omit<TSpawnCtx, 'callback'>

export const zurk = <T extends TZurkOptions = TZurkOptions, R = T['sync'] extends true ? Zurk : ZurkPromise>(opts: T): R =>
  (opts.sync ? zurkSync(opts) : zurkAsync(opts)) as R

export const zurkAsync = (opts: TZurkOptions): ZurkPromise => {
  let ctx: TSpawnCtxNormalized

  return new Proxy(new Promise<Zurk>((resolve, reject) => {
    ctx = normalizeCtx(opts, {
      sync: false,
      callback(err, data) {
        err ? reject(err) : resolve(new Zurk(data))
      }
    })

    invoke(ctx)
  }), {
    get(target: Promise<Zurk>, p: string | symbol, receiver: any): any {
      if (p === 'then') return target.then.bind(target)
      if (p === 'catch') return target.catch.bind(target)
      if (p === 'finally') return target.finally.bind(target)

      if (p === '_stdout') return ctx.stdout
      if (p === '_stderr') return ctx.stderr

      if (p in target) return Reflect.get(target, p, receiver)

      return target.then(v => Reflect.get(v, p, receiver))
    }
  }) as ZurkPromise
}

export const zurkSync = (opts: TZurkOptions): Zurk => {
  let response = new Zurk()
  const ctx = normalizeCtx(opts, {
    sync: true,
    callback(err, data) {
      response = new Zurk(data)
    }
  })

  invoke(ctx)

  return response as Zurk
}

export class Zurk implements TSpawnResult {
  error = null
  stderr =  ''
  stdout =  ''
  stdall = ''
  _stderr = new VoidWritable()
  _stdout = new VoidWritable()
  status = null
  signal = null
  duration = 0
  constructor(result?: Partial<TSpawnResult>) {
    Object.assign(this, result)
  }
  toString() { return this.stdall }
}
