import { TSpawnCtxNormalized, TShellResponse, TMixinHandler, TShell } from '../interface.js'

export const killMixin: TMixinHandler = (result: any, ctx: TSpawnCtxNormalized, $: TShell) => Object.assign(result, {
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
