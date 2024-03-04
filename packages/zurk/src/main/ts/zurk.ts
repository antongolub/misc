import {
  TSpawnCtx,
  TSpawnCtxNormalized,
  TSpawnResult,
  Promisified,
  TShellResponse,
  TShellResponseSync
} from './interface.js'
import { invoke, normalizeCtx } from './spawn.js'
import { isPromiseLike, makeDeferred } from './util.js'
import * as util from 'node:util'

export type ZurkPromise = Promise<Zurk> & Promisified<Zurk> // & Pick<TSpawnCtxNormalized, 'stdout' | 'stderr'>

export type TZurkOptions = Omit<TSpawnCtx, 'callback'>

export const zurk = <T extends TZurkOptions = TZurkOptions, R = T['sync'] extends true ? Zurk : ZurkPromise>(opts: T): R =>
  (opts.sync ? zurkSync(opts) : zurkAsync(opts)) as R

export const zurkAsync = (opts: TZurkOptions): ZurkPromise => {
  const { promise, resolve, reject } = makeDeferred<Zurk>()
  const ctx = normalizeCtx(opts, {
    sync: false,
    callback(err, data) {
      const _err = getError(err, ctx)
      _err ? reject(_err) : resolve(new Zurk(ctx))
    }
  })

  invoke(ctx)

  return zurkifyPromise(promise, ctx)
}

// eslint-disable-next-line sonarjs/cognitive-complexity
export const zurkifyPromise = <T = ZurkPromise>(target: any, ctx: TSpawnCtxNormalized) => isPromiseLike(target) && !util.types.isProxy(target)
  ? new Proxy(target, {
    get(target: Promise<Zurk>, p: string | symbol, receiver: any): any {
      if (p === 'then') return target.then.bind(target)
      if (p === 'catch') return target.catch.bind(target)
      if (p === 'finally') return target.finally.bind(target)
      if (p === 'stdio') return ctx.stdio
      if (p === '_ctx') return ctx

      if (p in target) return Reflect.get(target, p, receiver)

      return target.then(v => Reflect.get(v, p, receiver))
    }
  }) as T
  : target

export const zurkSync = (opts: TZurkOptions): Zurk => {
  let response: Zurk
  const ctx = normalizeCtx(opts, {
    sync: true,
    callback(err, data) {
      const _err = getError(err, ctx)
      if (_err) throw _err
      response = new Zurk(ctx)
    }
  })

  invoke(ctx)

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  return response as Zurk
}

export const getError = (err: any, ctx: TSpawnCtxNormalized) => {
  if (err !== null) return err
  if (ctx.fulfilled?.status) return new Error(`Command failed with exit code ${ctx.fulfilled?.status}`)
  if (ctx.fulfilled?.signal) return new Error(`Command failed with signal ${ctx.fulfilled?.signal}`)

  return null
}

export class Zurk implements TSpawnResult {
  _ctx: TSpawnCtxNormalized
  constructor(ctx: TSpawnCtxNormalized) {
    this._ctx = ctx
  }
  get status()    { return this._ctx.fulfilled?.status || null }
  get signal()    { return this._ctx.fulfilled?.signal || null }
  get error()     { return this._ctx.fulfilled?.error }
  get stderr()    { return this._ctx.fulfilled?.stderr || '' }
  get stdout()    { return this._ctx.fulfilled?.stdout || '' }
  get stdall()    { return this._ctx.fulfilled?.stdall || '' }
  get stdio(): TSpawnResult['stdio'] { return [
    this._ctx.stdin,
    this._ctx.stdout,
    this._ctx.stderr
  ]}
  get duration()  { return this._ctx.fulfilled?.duration || 0 }
  toString(){ return this.stdall.trim() }
}
