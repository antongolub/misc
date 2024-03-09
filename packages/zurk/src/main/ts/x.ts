import { Readable, Writable } from 'node:stream'
import {
  zurk,
  zurkifyPromise,
  isZurkAny,
  Zurk,
  ZurkPromise,
  TZurkOptions,
  TZurkCtx
} from './zurk.js'
import { type Promisified, isPromiseLike, isStringLiteral } from './util.js'
import { pipeMixin } from './mixin/pipe.js'
import { killMixin } from './mixin/kill.js'
import { timeoutMixin } from './mixin/timeout.js'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TShellCtx extends TZurkCtx {
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface TShellExtra {

}

export interface TShellOptionsExtra {
  timeout?: number
  timeoutSignal?: NodeJS.Signals
}

export interface TShellResponseExtra<T = any> {
  pipe(shell: T): T
  pipe(steam: Writable): Writable
  pipe(pieces: TemplateStringsArray, ...args: any[]): T
  kill(signal?: NodeJS.Signals | null): Promise<void>
  timeout?: number
  timeoutSignal?: NodeJS.Signals
}

export interface TShellResponse extends Omit<Promisified<Zurk>, 'stdio' | '_ctx'>, Promise<Zurk & TShellResponseExtra<TShellResponse>>, TShellResponseExtra<TShellResponse> {
  stdio: [Readable | Writable, Writable, Writable]
  _ctx: TShellCtx
}

export interface TShellResponseSync extends Zurk, TShellResponseExtra<TShellResponseSync> {
}

export type TMixin =
  (($: TShell, target: TZurkOptions) => TZurkOptions | Zurk | ZurkPromise) |
  (($: TShell, target: Zurk, ctx: TShellCtx) => Zurk) |
  (($: TShell, target: Promise<Zurk> | ZurkPromise, ctx: TShellCtx) => Zurk | ZurkPromise)

export type TShellOptions = Omit<TZurkOptions, 'input'> & {
  input?: TShellCtx['input'] | TShellResponse | TShellResponseSync | null
} & TShellOptionsExtra

export interface TShell extends TShellExtra {
  mixins: TMixin[]
  <O extends void>(this: O, pieces: TemplateStringsArray, ...args: any[]): TShellResponse
  <O extends TShellOptions = TShellOptions, R = O extends {sync: true} ? TShellResponseSync : TShellResponse>(this: O, pieces: TemplateStringsArray, ...args: any[]): R
  <O extends TShellOptions = TShellOptions, R = O extends {sync: true} ? TShellSync : TShell>(opts: O): R
}

export interface TShellSync {
  <O>(this: O, pieces: TemplateStringsArray, ...args: any[]): TShellResponseSync
  (opts: TShellOptions): TShellSync
}

export type TQuote = (input: string) => string

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
  if (isZurkAny(target)) return target

  const result: Zurk | ZurkPromise = zurk(target as TZurkOptions)
  return isPromiseLike(result)
    ? zurkifyPromise(
      (result as ZurkPromise).then((r: Zurk) => applyMixins($, r, result)) as Promise<Zurk>,
      result._ctx)
    : result as Zurk
}

$.mixins = [zurkMixin, killMixin, pipeMixin, timeoutMixin]

export const applyMixins = ($: TShell, result: Zurk | ZurkPromise | TZurkOptions, parent?: Zurk | ZurkPromise) => {
  let ctx: TShellCtx = (parent as ZurkPromise | Zurk)?._ctx

  return $.mixins.reduce((r, m) => {
    ctx = ctx || (r as ZurkPromise | Zurk)._ctx
    return m($, r as any, ctx)
  }, result)
}

export const parseInput = (input: TShellOptions['input']): TShellCtx['input'] => {
  if (typeof (input as TShellResponseSync)?.stdout === 'string') return (input as TShellResponseSync).stdout
  if ((input as TShellResponse)?._ctx) return (input as TShellResponse)._ctx.stdout

  return input as TShellCtx['input']
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
