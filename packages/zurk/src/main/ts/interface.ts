import { Readable, Writable } from 'node:stream'
import type cp from 'node:child_process'

export type TSpawnResult = {
  error?:   any,
  stderr:   string
  stdout:   string
  stdall:   string,
  _stdin:   Readable
  _stderr:  Writable
  _stdout:  Writable
  status:   number | null
  signal:   string | null
  duration: number
  _ctx:     TSpawnCtxNormalized
}

export type TSpawnCtx = Partial<Omit<TSpawnCtxNormalized, 'child'>>

export type TChild = ReturnType<typeof cp.spawn>

export type TInput = string | Buffer | Readable

export type TSpawnCtxNormalized = {
  cwd:        string
  cmd:        string
  sync:       boolean
  args:       ReadonlyArray<string>
  input:      TInput | null
  env:        Record<string, string | undefined>
  stdio:      ['pipe', 'pipe', 'pipe']
  shell:      string | true | undefined
  spawn:      typeof cp.spawn
  spawnSync:  typeof cp.spawnSync
  spawnOpts:  Record<string, any>
  callback:   (err: any, result: TSpawnResult & {error?: any, child?: TChild}) => void
  onStdout:   (data: string | Buffer) => void
  onStderr:   (data: string | Buffer) => void
  stdin:      Readable
  stdout:     Writable
  stderr:     Writable
  child?:     TChild
  fulfilled?: TSpawnResult
}

// https://stackoverflow.com/questions/47423241/replace-fields-types-in-interfaces-to-promises
export type Promisified<T> = {
  [K in keyof T]: T[K] extends (...args: any) => infer R ?
    (...args: Parameters<T[K]>) => Promise<R> :
    Promise<T>;
}
