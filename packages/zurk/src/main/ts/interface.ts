import { Readable, Writable } from 'node:stream'
import type cp from 'node:child_process'
import { TZurkOptions, Zurk, ZurkPromise } from './zurk.js'

export interface TShellExtra<T = any> {
  pipe(shell: T): T
  pipe(steam: Writable): Writable
  pipe(pieces: TemplateStringsArray, ...args: any[]): T
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

export interface TShellResponse extends Promisified<Zurk>, Promise<Zurk & TShellExtra<TShellResponse>>, TShellExtra<TShellResponse> {
}

export interface TShellResponseSync extends Zurk, TShellExtra<TShellResponseSync> {
}

export type TMixinHandler = (target: Zurk | ZurkPromise, $: TShell, ctx: TSpawnCtxNormalized) => Zurk | ZurkPromise

export interface TShell {
  mixins: TMixinHandler[]
  <O extends void>(this: O, pieces: TemplateStringsArray, ...args: any[]): TShellResponse
  <O extends TZurkOptions = TZurkOptions, R = O extends {sync: true} ? TShellResponseSync : TShellResponse>(this: O, pieces: TemplateStringsArray, ...args: any[]): R
  <O extends TZurkOptions = TZurkOptions, R = O extends {sync: true} ? TShellSync : TShell>(opts: O): R
}

export interface TShellSync {
  <O>(this: O, pieces: TemplateStringsArray, ...args: any[]): TShellResponseSync
  (opts: TZurkOptions): TShellSync
}

export type TQuote = (input: string) => string
