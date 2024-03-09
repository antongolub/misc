import { assign } from '../util.js'
import { TMixin, TShell, TShellCtx } from '../x.js'
import { type Zurk, type ZurkPromise, isZurkAny } from '../zurk.js'

export const killMixin: TMixin = <T extends Zurk | ZurkPromise >($: TShell, result: T, ctx: TShellCtx) =>
  isZurkAny(result)
    ? assign(result, {
      kill(signal: null | string | number | NodeJS.Signals = 'SIGTERM'): Promise<typeof signal> {
        return new Promise<typeof signal>((resolve, reject) => {
          if (ctx.child) {
            ctx.child.on('exit', (code, signal) => {
              resolve(signal)
            })
            process.kill(ctx.child.pid as number, signal as NodeJS.Signals)
          } else {
            reject(new Error('No child process to kill'))
          }
        })
      }
    })
    : result
