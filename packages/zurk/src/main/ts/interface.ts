import { Readable, Writable, Stream } from 'node:stream'
import type cp from 'node:child_process'
import { Zurk } from './zurk.js'

export type ZurkPromise = Promise<Zurk> & Promisified<Zurk> & { _ctx: TSpawnCtxNormalized, stdio: TSpawnCtxNormalized['stdio'] }

export type TZurkOptions = Omit<TSpawnCtx, 'callback'>

export interface TShellExtra<T = any> {
  pipe(shell: T): T
  pipe(steam: Writable): Writable
  pipe(pieces: TemplateStringsArray, ...args: any[]): T
  kill(signal?: NodeJS.Signals | null): Promise<void>
}

export type TSpawnResult = {
  error?:   any,
  stderr:   string
  stdout:   string
  stdall:   string,
  stdio:    [Readable | Writable, Writable, Writable]
  status:   number | null
  signal:   string | null
  duration: number
  _ctx:     TSpawnCtxNormalized
}

export type TSpawnCtx = Partial<Omit<TSpawnCtxNormalized, 'child'>>

export type TChild = ReturnType<typeof cp.spawn>

export type TInput = string | Buffer | Stream

export interface TSpawnCtxNormalized {
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
  run:        (cb: () => void, ctx: TSpawnCtxNormalized) => void
  // kill:       (signal: number) => void
}

// https://stackoverflow.com/questions/47423241/replace-fields-types-in-interfaces-to-promises
export type Promisified<T> = {
  [K in keyof T]: T[K] extends (...args: any) => infer R ?
    (...args: Parameters<T[K]>) => Promise<R> :
    Promise<T[K]>;
}

export interface TShellResponse extends Omit<Promisified<Zurk>, 'stdio' | '_ctx'>, Promise<Zurk & TShellExtra<TShellResponse>>, TShellExtra<TShellResponse> {
  stdio: [Readable | Writable, Writable, Writable]
  _ctx: TSpawnCtxNormalized
}

export interface TShellResponseSync extends Zurk, TShellExtra<TShellResponseSync> {
}

export type TMixin =
  (($: TShell, target: TZurkOptions) => TZurkOptions | Zurk | ZurkPromise) |
  (($: TShell, target: Zurk, ctx: TSpawnCtxNormalized) => Zurk) |
  (($: TShell, target: Promise<Zurk> | ZurkPromise, ctx: TSpawnCtxNormalized) => Zurk | ZurkPromise)

export type TShellOptions = Omit<TZurkOptions, 'input'> & {
  input?: TSpawnCtx['input'] | TShellResponse | TShellResponseSync | null
}

export interface TShell {
  mixins: TMixin[]
  <O extends void>(this: O, pieces: TemplateStringsArray, ...args: any[]): TShellResponse
  <O extends TShellOptions = TShellOptions, R = O extends {sync: true} ? TShellResponseSync : TShellResponse>(this: O, pieces: TemplateStringsArray, ...args: any[]): R
  <O extends TShellOptions = TShellOptions, R = O extends {sync: true} ? TShellSync : TShell>(opts: O): R
}

export interface TShellSync {
  <O>(this: O, pieces: TemplateStringsArray, ...args: any[]): TShellResponseSync
  (opts: TZurkOptions): TShellSync
}

export type TQuote = (input: string) => string
