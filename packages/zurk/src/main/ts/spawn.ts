import cp, {StdioNull, StdioPipe} from 'node:child_process'
import { Readable, Stream, Writable } from 'node:stream'
import { noop } from './util.js'

export type IO = StdioPipe | StdioNull

export type TSpawnStdio = [
  stdin: IO,
  stdout: IO,
  stderr: IO
]

export type TSpawnResult = Partial<{
  _stderr:  string
  _stdout:  string
  stderr:   Stream
  stdout:   Stream
  status:   number | null
  signal:   string | null
  duration: number
}>

export type TSpawnCtx = Partial<Omit<TSpawnCtxNormalized, 'child'>> & {
  cmd:      string
}

export type TChild = ReturnType<typeof cp.spawn>

export type TInput = string | Buffer | Readable

export type TSpawnCtxNormalized = {
  cmd:        string
  sync:       boolean
  args:       ReadonlyArray<string>
  input:      TInput | null
  stdio:      ['pipe', 'pipe', 'pipe']
  spawn:      typeof cp.spawn
  spawnSync:  typeof cp.spawnSync
  spawnOpts:  Record<string, any>
  callback:   (err: any, result: TSpawnResult & {error?: any, child?: TChild}) => void
  onStdout:   (data: string | Buffer) => void
  onStderr:   (data: string | Buffer) => void
  child?:     TChild
}

export const normalizeCtx = (ctx: TSpawnCtx): TSpawnCtxNormalized => ({
  sync:       false,
  args:       [],
  input:      null,
  spawn:      cp.spawn,
  spawnSync:  cp.spawnSync,
  spawnOpts:  {},
  callback:   noop,
  onStdout:   noop,
  onStderr:   noop,
  ...ctx,
  stdio:      ['pipe', 'pipe', 'pipe'],
})

export const processInput = (child: TChild, input?: TInput | null) => {
  if (input && child.stdin && !child.stdin.destroyed) {
    if (input instanceof Stream) {
      input.pipe(child.stdin)
    } else {
      child.stdin.write(input)
      child.stdin.end()
    }
  }
}

export const readableFrom = (data: string | Buffer) => {
  const stream = new Readable()
  stream.push(data)
  stream.push(null)
  return stream
}

export const invoke = (ctx: TSpawnCtx): TSpawnCtxNormalized => {
  const now = Date.now()
  const c = normalizeCtx(ctx)
  const stderr = new Writable()
  const stdout = new Writable()

  try {
    if (c.sync) {
      const opts = { ...c.spawnOpts, stdio: c.stdio, input: c.input as string | Buffer }
      const result = c.spawnSync(c.cmd, c.args, opts)

      c.onStdout(result.stdout)
      c.onStderr(result.stderr)
      c.callback(null, {
        ...result,
        _stdout:  result.stdout.toString(),
        _stderr:  result.stderr.toString(),
        stdout:   readableFrom(result.stdout),
        stderr:   readableFrom(result.stderr),
        duration: Date.now() - now
      })

    } else {
      setImmediate(() => {
        let error: any = null
        let status: number | null = null
        const opts = { ...c.spawnOpts, stdio: c.stdio }
        const _stderr: string[] = []
        const _stdout: string[] = []
        const child = c.spawn(c.cmd, c.args, opts)
        c.child = child
        processInput(child, c.input)

        child.stdout.on('data', (d) => { _stdout.push(d.toString()); c.onStdout(d) })
        child.stderr.on('data', (d) => { _stderr.push(d.toString()); c.onStderr(d) })
        child.on('error', (e) => error = e)
        child.on('exit', (code) => status = code)
        child.on('close', () => {
          c.callback(error, {
            error,
            status,
            _stdout:  _stdout.join(''),
            _stderr:  _stderr.join(''),
            stdout:   child.stdout,
            stderr:   child.stderr,
            signal:   child.signalCode,
            child,
            duration: Date.now() - now
          })
        })
      })
    }
  } catch (error: unknown) {
    c.callback(
      error,
      {
        error,
        duration: Date.now() - now
      }
    )
  }

  return c
}

// https://2ality.com/2018/05/child-process-streams.html
