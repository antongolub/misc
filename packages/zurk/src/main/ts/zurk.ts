import util from 'node:util'
import {
  invoke,
  normalizeCtx,
  TSpawnCtx,
  TSpawnCtxNormalized,
  TSpawnResult,
} from './spawn.js'
import { isPromiseLike, makeDeferred, type Promisified } from './util.js'

export type ZurkPromise = Promise<Zurk> & Promisified<Zurk> & { _ctx: TSpawnCtxNormalized, stdio: TSpawnCtxNormalized['stdio'] }

export type TZurkOptions = Omit<TSpawnCtx, 'callback'>

export const ZURK = Symbol('Zurk')

export const zurk = <T extends TZurkOptions = TZurkOptions, R = T extends {sync: true} ? Zurk : ZurkPromise>(opts: T): R =>
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

// eslint-disable-next-line sonarjs/cognitive-complexity
export const zurkifyPromise = (target: Promise<Zurk> | ZurkPromise, ctx: TSpawnCtxNormalized) => isPromiseLike(target) && !util.types.isProxy(target)
  ? new Proxy(target, {
    get(target: Promise<Zurk>, p: string | symbol, receiver: any): any {
      if (p === 'then') return target.then.bind(target)
      if (p === 'catch') return target.catch.bind(target)
      if (p === 'finally') return target.finally.bind(target)
      if (p === 'stdio') return ctx.stdio
      if (p === '_ctx') return ctx
      if (p === ZURK) return ZURK

      if (p in target) return Reflect.get(target, p, receiver)

      return target.then(v => Reflect.get(v, p, receiver))
    }
  }) as ZurkPromise
  : target as ZurkPromise


export const getError = (err: any, ctx: TSpawnCtxNormalized) => {
  if (err !== null) return err
  if (ctx.fulfilled?.status) return new Error(`Command failed with exit code ${ctx.fulfilled?.status}`)
  if (ctx.fulfilled?.signal) return new Error(`Command failed with signal ${ctx.fulfilled?.signal}`)

  return null
}

export const isZurk = (o: any): o is Zurk => o?.[ZURK] === ZURK
export const isZurkPromise = (o: any): o is ZurkPromise => o?.[ZURK] === ZURK && o instanceof Promise
export const isZurkAny = (o: any): o is Zurk | ZurkPromise => isZurk(o) || isZurkPromise(o)

export class Zurk implements TSpawnResult {
  _ctx: TSpawnCtxNormalized
  [ZURK] = ZURK
  constructor(ctx: TSpawnCtxNormalized) {
    this._ctx = ctx
  }
  get status()  { return this._ctx.fulfilled?.status || null }
  get signal()  { return this._ctx.fulfilled?.signal || null }
  get error()   { return this._ctx.fulfilled?.error }
  get stderr()  { return this._ctx.fulfilled?.stderr || '' }
  get stdout()  { return this._ctx.fulfilled?.stdout || '' }
  get stdall()  { return this._ctx.fulfilled?.stdall || '' }
  get stdio(): TSpawnResult['stdio'] { return [
    this._ctx.stdin,
    this._ctx.stdout,
    this._ctx.stderr
  ]}
  get duration()  { return this._ctx.fulfilled?.duration || 0 }
  toString(){ return this.stdall.trim() }
}
