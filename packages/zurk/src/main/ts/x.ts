import { Zurk, zurk, zurkifyPromise, ZurkPromise } from './zurk.js'
import { TShell, TQuote, TMixinHandler, TSpawnCtxNormalized } from './interface.js'
import { pipeMixin } from './mixin/pipe.js'
import { killMixin } from './mixin/kill.js'
import { isPromiseLike } from './util.js'

export const $: TShell = function(this: any, pieces: any, ...args: any): any {
  if (isLiteral(pieces)) {
    const opts = this || {}
    const cmd = formatCmd(quote, pieces as TemplateStringsArray, ...args)
    const run = isPromiseLike(cmd)
      ? (cb: any, ctx: any) => (cmd as Promise<string>).then((cmd) => { ctx.cmd = cmd; cb() })
      : setImmediate
    const result = zurk(Object.assign(opts, { cmd, run }))

    return applyMixins(isPromiseLike(result)
      ? ((result as ZurkPromise).then((r: Zurk) => applyMixins(r, $.mixins, result._ctx as TSpawnCtxNormalized, $)) as ZurkPromise)
      : result, $.mixins, result._ctx as TSpawnCtxNormalized, $)
  }

  return (...args: any) => $.apply(isLiteral(args[0]) ? pieces : this, args)
}
$.mixins = [killMixin, pipeMixin, zurkifyPromise]

export const isLiteral = (pieces: any) => typeof pieces?.[0] === 'string'

export const applyMixins = (result: Zurk | ZurkPromise, mixins: TMixinHandler[], ctx: TSpawnCtxNormalized, $: TShell) =>
  mixins.reduce((r, m) => m(r, ctx, $), result)

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