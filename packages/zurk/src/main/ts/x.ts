import { Promisified } from './interface.js'
import { TSpawnCtxNormalized, TSpawnCtx } from './spawn.js'
import {
  zurk,
  zurkifyPromise,
  TZurkOptions,
  Zurk,
  ZurkPromise
} from './zurk.js'

export interface TShellExtra<T = any> {
  pipe(shell: T): T
  pipe(steam: Writable): Writable
  pipe(pieces: TemplateStringsArray, ...args: any[]): T
  kill(signal?: NodeJS.Signals | null): Promise<void>
}

export interface TShellResponse extends Omit<Promisified<Zurk>, 'stdio' | '_ctx'>, Promise<Zurk & TShellExtra<TShellResponse>>, TShellExtra<TShellResponse> {
  stdio: [Readable | Writable, Writable, Writable]
  _ctx: TSpawnCtxNormalized
}

export interface TShellResponseSync extends Zurk, TShellExtra<TShellResponseSync> {
}

export type TMixin =
  (($: TShell, target: TZurkOptions) => TZurkOptions | Zurk | ZurkPromise) |
  (($: TShell, target: Zurk, ctx: TSpawnCtxNormalized) => Zurk) |
  (($: TShell, target: Promise<Zurk> | ZurkPromise, ctx: TSpawnCtxNormalized) => Zurk | ZurkPromise)

export type TShellOptions = Omit<TZurkOptions, 'input'> & {
  input?: TSpawnCtx['input'] | TShellResponse | TShellResponseSync | null
}

export interface TShell {
  mixins: TMixin[]
  <O extends void>(this: O, pieces: TemplateStringsArray, ...args: any[]): TShellResponse
  <O extends TShellOptions = TShellOptions, R = O extends {sync: true} ? TShellResponseSync : TShellResponse>(this: O, pieces: TemplateStringsArray, ...args: any[]): R
  <O extends TShellOptions = TShellOptions, R = O extends {sync: true} ? TShellSync : TShell>(opts: O): R
}

export interface TShellSync {
  <O>(this: O, pieces: TemplateStringsArray, ...args: any[]): TShellResponseSync
  (opts: TZurkOptions): TShellSync
}

export type TQuote = (input: string) => string

import { pipeMixin } from './mixin/pipe.js'
import { killMixin } from './mixin/kill.js'
import { isPromiseLike, isStringLiteral } from './util.js'
import {Readable, Writable} from "node:stream";

export const $: TShell = function(this: any, pieces: any, ...args: any): any {
  if (isStringLiteral(pieces)) {
    const cmd = formatCmd(quote, pieces as TemplateStringsArray, ...args)
    const input = parseInput(this?.input)
    const run = cmd instanceof Promise
      ? (cb: any, ctx: any) => cmd.then((cmd) => { ctx.cmd = cmd; cb() })
      : setImmediate
    const opts = Object.assign(this || {}, { cmd, run, input })

    return applyMixins($, opts)
  }

  return (...args: any) => $.apply(isStringLiteral(args[0]) ? pieces : this, args)
}

const zurkMixin: TMixin = ($: TShell, target: TZurkOptions | Zurk | ZurkPromise | Promise<Zurk>) => {
  if (target instanceof Zurk || target instanceof Promise) return target as TZurkOptions

  const result: Zurk | ZurkPromise = zurk(target)
  return isPromiseLike(result)
    ? zurkifyPromise(
      (result as ZurkPromise).then((r: Zurk) => applyMixins($, r, result)) as Promise<Zurk>,
      result._ctx)
    : result as Zurk
}

$.mixins = [zurkMixin, killMixin, pipeMixin]

export const applyMixins = ($: TShell, result: Zurk | ZurkPromise | TZurkOptions, parent?: Zurk | ZurkPromise) => {
  let ctx: TSpawnCtxNormalized = (parent as ZurkPromise | Zurk)?._ctx
  return $.mixins.reduce((r, m) => {
    ctx = ctx || (r as ZurkPromise | Zurk)._ctx
    return m($, r as any, ctx)
  }, result)
}

export const parseInput = (input: TShellOptions['input']): TSpawnCtx['input'] => {
  if (typeof (input as TShellResponseSync)?.stdout === 'string') return (input as TShellResponseSync).stdout
  if ((input as TShellResponse)?._ctx) return (input as TShellResponse)._ctx.stdout

  return input as TSpawnCtx['input']
}

export const formatCmd = (quote: TQuote, pieces: TemplateStringsArray, ...args: any[]): string | Promise<string> =>  {
  if (args.some(isPromiseLike))
    return Promise.all(args).then((args) => formatCmd(quote, pieces, ...args))

  let cmd = pieces[0], i = 0
  while (i < args.length) {
    const s = Array.isArray(args[i])
      ? args[i].map((x: any) => quote(substitute(x))).join(' ')
      : quote(substitute(args[i]))

    cmd += s + pieces[++i]
  }

  return cmd
}

export const substitute = (arg: any) =>
  (typeof arg?.stdout === 'string')
    ? arg.stdout.replace(/\n$/, '')
    : `${arg}`

export const quote = (arg: string) => {
  if (/^[\w./:=@-]+$/i.test(arg) || arg === '') {
    return arg
  }
  return (
    `$'` +
    arg
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\f/g, '\\f')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\v/g, '\\v')
      .replace(/\0/g, '\\0') +
    `'`
  )
}
