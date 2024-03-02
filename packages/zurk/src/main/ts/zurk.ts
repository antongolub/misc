import { TSpawnCtx, TSpawnCtxNormalized, TSpawnResult, Promisified } from './interface.js'
import { invoke, normalizeCtx, VoidWritable } from './spawn.js'
import { makeDeferred } from './util.js'

export type ZurkPromise = Promise<Zurk> & Promisified<Zurk> & Pick<TSpawnCtxNormalized, 'stdout' | 'stderr'>

export type TZurkOptions = Omit<TSpawnCtx, 'callback'>

export const zurk = <T extends TZurkOptions = TZurkOptions, R = T['sync'] extends true ? Zurk : ZurkPromise>(opts: T): R =>
  (opts.sync ? zurkSync(opts) : zurkAsync(opts)) as R

export const zurkAsync = (opts: TZurkOptions): ZurkPromise => {
  const { promise, resolve, reject } = makeDeferred<Zurk>()
  const ctx = normalizeCtx(opts, {
    sync: false,
    callback(err, data) {
      err ? reject(err) : resolve(new Zurk(data, ctx))
    }
  })

  invoke(ctx)

  return new Proxy(promise, {
    get(target: Promise<Zurk>, p: string | symbol, receiver: any): any {
      if (p === 'then') return target.then.bind(target)
      if (p === 'catch') return target.catch.bind(target)
      if (p === 'finally') return target.finally.bind(target)

      if (p === '_stdin') return ctx.stdin
      if (p === '_stdout') return ctx.stdout
      if (p === '_stderr') return ctx.stderr
      if (p === '_ctx') return ctx

      if (p in target) return Reflect.get(target, p, receiver)

      return target.then(v => Reflect.get(v, p, receiver))
    }
  }) as ZurkPromise
}

export const zurkSync = (opts: TZurkOptions): Zurk => {
  let response: Zurk
  const ctx = normalizeCtx(opts, {
    sync: true,
    callback(err, data) {
      response = new Zurk(data, ctx)
    }
  })

  invoke(ctx)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return response as Zurk
}

export class Zurk implements TSpawnResult {
  _ctx: TSpawnCtxNormalized
  error = null
  stderr =  ''
  stdout =  ''
  stdall = ''
  _stdin = new VoidWritable()
  _stderr = new VoidWritable()
  _stdout = new VoidWritable()
  status = null
  signal = null
  duration = 0
  constructor(result: Partial<TSpawnResult> | undefined, ctx: TSpawnCtxNormalized) {
    this._ctx = ctx
    Object.assign(this, result)
  }
  toString() { return this.stdall }
}
