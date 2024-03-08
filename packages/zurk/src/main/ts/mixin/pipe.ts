import { Writable } from 'node:stream'
import type { VoidWritable, TSpawnCtxNormalized } from '../spawn.js'
import type { TShell, TMixin } from '../x.js'
import { type Zurk, type ZurkPromise, isZurkAny } from '../zurk.js'

// eslint-disable-next-line sonarjs/cognitive-complexity
export const pipeMixin: TMixin = <T extends Zurk | ZurkPromise >($: TShell, result: T, ctx: TSpawnCtxNormalized) =>
  isZurkAny(result)
    ? Object.assign(result, {
      pipe(...args: any[]) {
        const stream = args[0]
        const { fulfilled, stdout} = ctx
        if (isZurkAny(stream)) {
          if (fulfilled) {
            stream._ctx.input = fulfilled.stdout
          } else {
            stream._ctx.stdin = stdout as VoidWritable
          }

          return stream
        }

        if (stream instanceof Writable) {
          if (fulfilled) {
            stream.write(result.stdout)
            stream.end()

            return stream
          }

          return stdout.pipe(stream)
        }

        return $.apply({input: fulfilled?.stdout || stdout, sync: !('then' in result)}, args as any)
      }
    })
    : result
