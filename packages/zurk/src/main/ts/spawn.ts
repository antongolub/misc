import cp from 'node:child_process'
import { Stream, Transform } from 'node:stream'
import { noop } from './util.js'
import type { TChild, TInput, TSpawnCtx, TSpawnCtxNormalized } from './interface.js'

export const normalizeCtx = (...ctxs: TSpawnCtx[]): TSpawnCtxNormalized => Object.defineProperties({
  cmd:        '',
  cwd:        process.cwd(),
  sync:       false,
  args:       [],
  input:      null,
  env:        process.env,
  shell:      true,
  spawn:      cp.spawn,
  spawnSync:  cp.spawnSync,
  spawnOpts:  {},
  callback:   noop,
  onStdout:   noop,
  onStderr:   noop,
  stdin:      new VoidWritable(),
  stdout:     new VoidWritable(),
  stderr:     new VoidWritable(),
  stdio:      ['pipe', 'pipe', 'pipe'],
}, ctxs.reduce<Record<string, any>>((m: TSpawnCtx, ctx) => ({...m, ...Object.getOwnPropertyDescriptors(ctx)}), {}))

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

export class VoidWritable extends Transform {
  // __data: any[] = []
  _transform(chunk: any, _: string, cb: (err?: Error) => void) {
    this.emit('data', chunk)
    // this.__data.push(chunk)
    cb()
  }
  // _write(chunk: any, _: string, cb: (err?: Error) => void) {
  //   this.emit('data', chunk)
  //   cb()
  // }
}

export const buildSpawnOpts = ({spawnOpts, stdio, cwd, shell, input, env}: TSpawnCtxNormalized) => ({
  ...spawnOpts,
  env,
  cwd,
  stdio,
  shell,
  input: input as string | Buffer,
  windowsHide: true
})

export const invoke = (c: TSpawnCtxNormalized): TSpawnCtxNormalized => {
  const now = Date.now()

  try {
    if (c.sync) {
      const opts = buildSpawnOpts(c)
      const result = c.spawnSync(c.cmd, c.args, opts)

      c.stdout.write(result.stdout)
      c.stderr.write(result.stderr)
      c.onStdout(result.stdout)
      c.onStderr(result.stderr)
      c.callback(null, c.fulfilled = {
        ...result,
        stdout:   result.stdout.toString(),
        stderr:   result.stderr.toString(),
        get stdall() { return this.stdout + this.stderr },
        _stdin:   c.stdin,
        _stdout:  c.stdout,
        _stderr:  c.stderr,
        duration: Date.now() - now,
        _ctx:     c
      })

    } else {
      setImmediate(() => {
        let error: any = null
        let status: number | null = null
        const opts = buildSpawnOpts(c)
        const stderr: string[] = []
        const stdout: string[] = []
        const stdall: string[] = []
        const child = c.spawn(c.cmd, c.args, opts)
        c.child = child
        processInput(child, c.input || c.stdin)

        child.stdout.pipe(c.stdout).on('data', (d) => { stdout.push(d); stdall.push(d); c.onStdout(d) })
        child.stderr.pipe(c.stderr).on('data', (d) => { stderr.push(d); stdall.push(d); c.onStderr(d) })
        child.on('error', (e) => error = e)
        child.on('exit', (code) => status = code)
        child.on('close', () => {
          c.callback(error, c.fulfilled = {
            error,
            status,
            stdout:   stdout.join(''),
            stderr:   stderr.join(''),
            stdall:   stdall.join(''),
            _stdin:   c.stdin,
            _stdout:  c.stdout,
            _stderr:  c.stderr,
            signal:   child.signalCode,
            duration: Date.now() - now,
            _ctx:     c
          })
        })
      })
    }
  } catch (error: unknown) {
    c.callback(
      error,
      c.fulfilled ={
        error,
        status:   null,
        signal:   null,
        stdout:   '',
        stderr:   '',
        stdall:   '',
        _stdin:   c.stdin,
        _stdout:  c.stdout,
        _stderr:  c.stderr,
        duration: Date.now() - now,
        _ctx:     c
      }
    )
  }

  return c
}

// https://2ality.com/2018/05/child-process-streams.html
