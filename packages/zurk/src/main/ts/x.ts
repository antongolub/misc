import { Zurk, zurk, ZurkPromise} from './zurk.js'
import { TShell, TQuote, TMixinHandler, TSpawnCtxNormalized } from './interface.js'
import { pipeMixin } from './mixin/pipe.js'
import { ctxMixin } from './mixin/ctx.js'
import { isThenable } from './util.js'

const isLiteral = (pieces: any) => typeof pieces?.[0] === 'string'

export const applyMixins = (result: Zurk | ZurkPromise, mixins: TMixinHandler[], $: TShell, ctx: TSpawnCtxNormalized) =>
  mixins.reduce((r, m) => m(r, $, ctx), result)

export const $: TShell = function(this: any, pieces: any, ...args: any): any {
  if (isLiteral(pieces)) {
    const cmd = formatCmd(quote, pieces as TemplateStringsArray, ...args)
    const result = zurk(Object.assign(this || {}, { cmd }))

    return applyMixins(isThenable(result)
      ? ((result as ZurkPromise).then((r: Zurk) => applyMixins(r, $.mixins, $, result._ctx as TSpawnCtxNormalized)) as ZurkPromise)
      : result, $.mixins, $, result._ctx as TSpawnCtxNormalized)
  }

  return (...args: any) => $.apply(isLiteral(args[0]) ? pieces : this, args)
}
$.mixins = [ctxMixin, pipeMixin]

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