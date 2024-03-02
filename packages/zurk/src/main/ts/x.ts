import { Writable } from 'node:stream'
import { Zurk, zurk, ZurkPromise } from './zurk.js'
import { isThenable } from './util.js'
import { processInput, VoidWritable } from './spawn.js'

export interface TShellResponse {
  pipe(steam: Writable): Writable
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
    pipe(...args: any[]): typeof args[0] extends Writable ? Writable : TShellResponse {
      const stream = args[0]
      if (stream instanceof Writable) {
        if (result.stdout) {
          stream.write(result.stdout)
          stream.end()

          return stream
        } else {
          return (ctx._stdout as VoidWritable).pipe(stream)
        }
      }

      return $.apply({input: result.stdout || ctx._stdout}, args as any) as unknown as TShellResponse
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