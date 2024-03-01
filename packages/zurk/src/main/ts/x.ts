import { Stream, Readable } from 'node:stream'
import {Zurk, zurk, ZurkPromise} from './zurk.js'
import {isThenable} from "./util.js";

export interface TShellResponse {
  pipe(steam: Stream): TShellResponse
  pipe(pieces: TemplateStringsArray, ...args: any[]): TShellResponse
}

export interface TShell {
  (pieces: TemplateStringsArray, ...args: any[]): TShellResponse
  (opts: Record<any, any>): TShell
}

export type TQuote = (input: string) => string

export const $: TShell = new Proxy<TShell>(function(this: any, pieces, ...args) {
  if (typeof (pieces as any)[0] === 'string') return $({
    ...this,
    cmd: formatCmd(quote, pieces as TemplateStringsArray, ...args)
  })

  const result = zurk(pieces as any)
  return mixPipe(isThenable(result) ? (result as any).then((r: ZurkPromise) => mixPipe(r)) : result, result)
}, {})

const mixPipe = (result: Zurk | ZurkPromise, ctx = result) => {
  return Object.assign(result, {
    pipe(...args: any[]) {
      return $.apply({input: ctx._stdout}, args as any)
    }
  })
}


export const formatCmd = (quote: TQuote, pieces: TemplateStringsArray, ...args: any[]) =>  {
  let cmd = pieces[0], i = 0
  while (i < args.length) {
    let s
    if (Array.isArray(args[i])) {
      s = args[i].map((x: any) => quote(substitute(x))).join(' ')
    } else {
      s = quote(substitute(args[i]))
    }
    cmd += s + pieces[++i]
  }

  return cmd
}

export const substitute = (arg: any) =>
  (arg?.stdout?.endsWith?.('\n'))
    ? arg.stdout.slice(0, -1)
    : `${arg}`

export const quote = (arg: string) => {
  if (/^[a-z0-9/_.\-@:=]+$/i.test(arg) || arg === '') {
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