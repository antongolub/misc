import process from 'node:process'
import { ChildProcess } from 'node:child_process'
import { assign } from '../util.js'
import type { TMixin, TShell, TShellCtx } from '../x.js'
import { type TZurk, type TZurkPromise, isZurkAny } from '../zurk.js'

const kill = (child?: ChildProcess, signal: null | string | number | NodeJS.Signals = 'SIGTERM') => new Promise<typeof signal>((resolve, reject) => {
  if (child) {
    child.on('exit', (code, signal) => {
      resolve(signal)
    })
    process.kill(child.pid as number, signal as NodeJS.Signals)
  } else {
    reject(new Error('No child process to kill'))
  }
})

export const killMixin: TMixin = <T extends TZurk | TZurkPromise >($: TShell, result: T, ctx: TShellCtx) =>
  isZurkAny(result)
    ? assign(result, {
      kill(signal?: null | string | number | NodeJS.Signals): Promise<typeof signal> {
        return kill(ctx.child, signal)
      }
    })
    : result
