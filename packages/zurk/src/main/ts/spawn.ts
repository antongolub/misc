import cp, {StdioNull, StdioPipe} from 'node:child_process'

export type IO = StdioPipe | StdioNull

export type TSpawnStdio = [
  stdin: IO,
  stdout: IO,
  stderr: IO
]

export type TSpawnResult = {
  stderr:   string
  stdout:   string
  status:   number | null
  signal:   string | null
  duration: number
}

export type TSpawnCtx = {
  cmd:        string
  sync?:      boolean
  args?:      ReadonlyArray<string>
  stdio?:     TSpawnStdio
  spawn?:     typeof cp.spawn
  spawnSync?: typeof cp.spawnSync
  spawnOpts?: Record<string, any>
  callback?:  (err: any, result: TSpawnResult & {error?: any, p?: ReturnType<typeof cp.spawn>}) => void
  onStdout?:  (data: string | Buffer) => void
  onStderr?:  (data: string | Buffer) => void
}

const noop = () => { /* noop */ }

const makeDeferred = () => {
  let resolve
  let reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return {resolve, reject, promise}
}

export const invoke = (ctx: TSpawnCtx): void => {
  const now = Date.now()
  const {
    sync,
    cmd,
    args = [],
    stdio = ['inherit', 'pipe', 'pipe'],
    spawn = cp.spawn,
    spawnSync = cp.spawnSync,
    spawnOpts = {},
    callback = noop,
    onStdout = noop,
    onStderr = noop
  } = ctx

  const opts = { stdio, ...spawnOpts }
  try {
    if (sync) {
      const result = spawnSync(cmd, args, opts)

      onStdout(result.stdout)
      onStderr(result.stderr)
      callback(null, {
        ...result,
        stdout: result.stdout.toString(),
        stderr: result.stderr.toString(),
        duration: Date.now() - now
      })

    } else {
      const p = spawn(cmd, args, opts)
      const stderr: string[] = []
      const stdout: string[] = []
      let error:    any = null
      let status:   number | null = null

      p.stdout?.on('data', (d) => { stdout.push(d.toString()); onStdout(d) })
      p.stderr?.on('data', (d) => { stderr.push(d.toString()); onStderr(d) })
      p.on('error', (e) => error = e)
      p.on('exit', (code) => status = code)
      p.on('close', () => {
        callback(error, {
          error,
          status,
          stderr: stderr.join(''),
          stdout: stdout.join(''),
          signal: p.signalCode,
          duration: Date.now() - now,
          p
        })
      })
    }
  } catch (error: unknown) {
    callback(
      error,
      { error, stderr: '', stdout: '', status: null, signal: null, duration: Date.now() - now }
    )
  }
}
