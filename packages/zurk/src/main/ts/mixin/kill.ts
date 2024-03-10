import process from 'node:process'
import { assign } from '../util.js'
import type { TMixin, TShell, TShellCtx } from '../x.js'
import { type TZurk, type TZurkPromise, isZurkAny } from '../zurk.js'

export const killMixin: TMixin = <T extends TZurk | TZurkPromise >($: TShell, result: T, ctx: TShellCtx) =>
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
