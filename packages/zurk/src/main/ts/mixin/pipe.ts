import { Writable } from 'node:stream'
import { TSpawnCtxNormalized, TShellResponse, TMixinHandler, TShell } from '../interface.js'
import { VoidWritable } from '../spawn.js'

export const pipeMixin: TMixinHandler = (result: any, ctx: TSpawnCtxNormalized, $: TShell) => Object.assign(result, {
  pipe(...args: any[]): typeof args[0] extends Writable ? Writable : TShellResponse {
    const stream = args[0]
    const { fulfilled, stdout} = ctx
    if (stream._ctx) {
      if (fulfilled) {
        stream._ctx.input = fulfilled.stdout
      } else {
        stream._ctx.stdin = stdout as VoidWritable
      }

      return stream as unknown as TShellResponse
    }

    if (stream instanceof Writable) {
      if (result.stdout) {
        stream.write(result.stdout)
        stream.end()

        return stream
      }

      return stdout.pipe(stream)
    }
    return $.apply({input: fulfilled?.stdout || stdout, sync: !('then' in result)}, args as any) as unknown as TShellResponse
  }
})
