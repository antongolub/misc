import { Writable } from 'node:stream'
import type { VoidWritable, TSpawnCtxNormalized } from '../spawn.js'
import type { TShell, TShellResponse, TMixin } from '../x.js'
import type { Zurk, ZurkPromise } from '../zurk.js'

export const pipeMixin: TMixin = <T extends Zurk | ZurkPromise >($: TShell, result: T, ctx: TSpawnCtxNormalized) => Object.assign(result, {
  pipe(...args: any[]): typeof args[0] extends Writable ? Writable : TShellResponse {
    const stream = args[0]
    const { fulfilled, stdout} = ctx
    if (stream._ctx) {
      if (fulfilled) {
        stream._ctx.input = fulfilled.stdout
      } else {
        stream._ctx.stdin = stdout as VoidWritable
      }

      return stream
    }

    if (stream instanceof Writable) {
      if (result.stdout) {
        stream.write(result.stdout)
        stream.end()

        return stream
      }

      return stdout.pipe(stream)
    }
    return $.apply({input: fulfilled?.stdout || stdout, sync: !('then' in result)}, args as any) as TShellResponse
  }
})
