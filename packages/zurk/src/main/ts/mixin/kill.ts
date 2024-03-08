import type { TSpawnCtxNormalized } from '../spawn.js'
import type { TMixin, TShell } from '../x.js'
import { type Zurk, type ZurkPromise, isZurkAny } from '../zurk.js'

export const killMixin: TMixin = <T extends Zurk | ZurkPromise >($: TShell, result: T, ctx: TSpawnCtxNormalized) =>
  isZurkAny(result)
    ? Object.assign(result, {
      kill(signal: number | NodeJS.Signals = 'SIGTERM'): Promise<void> {
        return new Promise<any>((resolve, reject) => {
          if (ctx.child) {
            process.kill(ctx.child.pid as number, signal)
            ctx.child.on('exit', (code, signal) => {
              resolve(signal)
            })
          } else {
            reject(new Error('No child process to kill'))
          }
        })
      }
    })
    : result
