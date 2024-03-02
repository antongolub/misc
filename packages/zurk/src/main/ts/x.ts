import { Writable } from 'node:stream'
import { TZurkOptions, Zurk, zurk, ZurkPromise } from './zurk.js'
import { isThenable } from './util.js'
import { VoidWritable } from './spawn.js'
import { Promisified } from './interface.js'

export type TPipeExtra<T = any> = {
  pipe(steam: Writable): Writable
  pipe(pieces: TemplateStringsArray, ...args: any[]): T
}

export interface TShellResponse extends Promisified<Zurk>, Promise<Zurk & TPipeExtra<TShellResponse>>, TPipeExtra<TShellResponse> {
}

export interface TShellResponseSync extends Zurk, TPipeExtra<TShellResponseSync> {
}

export interface TShell {
  <O extends void>(this: O, pieces: TemplateStringsArray, ...args: any[]): TShellResponse
  <O extends TZurkOptions = TZurkOptions, R = O extends {sync: true} ? TShellResponseSync : TShellResponse>(this: O, pieces: TemplateStringsArray, ...args: any[]): R
  <O extends TZurkOptions = TZurkOptions, R = O extends {sync: true} ? TShellSync : TShell>(opts: O): R
}

export interface TShellSync {
  <O>(this: O, pieces: TemplateStringsArray, ...args: any[]): TShellResponseSync
  (opts: TZurkOptions): TShellSync
}

export type TQuote = (input: string) => string

const isLiteral = (pieces: any) => typeof pieces[0] === 'string'

export const $: TShell = new Proxy<TShell>(function(this: any, pieces: any, ...args: any): any {
  if (isLiteral(pieces)) {
    const cmd = formatCmd(quote, pieces as TemplateStringsArray, ...args)
    const result = zurk(Object.assign(this || {}, { cmd }))
    return mixPipe(isThenable(result) ? (result as any).then((r: ZurkPromise) => mixPipe(r)) : result, result)
  }

  return (...args: any) => $.apply(isLiteral(args[0]) ? pieces : this, args)
}, {})

const mixPipe = (result: Zurk | ZurkPromise, ctx = result) =>
  Object.assign(result, {
    pipe(...args: any[]): typeof args[0] extends Writable ? Writable : TShellResponse {
      const stream = args[0]
      if (stream instanceof Writable) {
        if (result.stdout) {
          stream.write(result.stdout)
          stream.end()

          return stream
        }

        return (ctx._stdout as VoidWritable).pipe(stream)
      }
// console.log('@@@', result)
      return $.apply({input: result.stdout || ctx._stdout, sync: !('then' in ctx)}, args as any) as unknown as TShellResponse
    }
  })

export const formatCmd = (quote: TQuote, pieces: TemplateStringsArray, ...args: any[]) =>  {
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
  (arg?.stdout?.endsWith?.('\n'))
    ? arg.stdout.slice(0, -1)
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