import {TCmds, TDirective, TInjects, TOperator, TPipeline, TProcessContext} from './interface.ts'
import {DATA, DROP, VARARG} from './constants.ts'
import {expand, get, getPromise} from './util.ts'

export const process = <T = any>(ctx: TProcessContext, vertex = ''): Promise<T> => {
  const {pipelines, edges, values} = ctx
  const pipeline = pipelines[vertex]

  if (!pipeline) {
    throw new Error(`Unknown vertex: ${vertex}`)
  }

  if (values[vertex]) {
    return values[vertex] as Promise<T>
  }

  const { promise, resolve } = getPromise<T>()
  values[vertex] = promise
  resolve(processPipeline(pipeline, ctx))

  return promise
}

export const processPipeline = async <T>(pipeline: TPipeline, ctx: TProcessContext): Promise<T> => {
  let i = 0
  let pipe: TDirective | TOperator | undefined = pipeline[i]
  let result: T | symbol = DROP
  let err: any

  const cmds: TCmds = {[DATA]: processData, ...ctx.cmds}
  while (pipe) {
    const {op} = pipe
    if (typeof op === 'string') {
      pipe = undefined
      continue
    }

    const {cmd, injects, mappings, args} = pipe
    const _cmd = cmds[cmd]
    if (!_cmd) {
      throw new Error(`cmd not found: ${String(cmd)}`)
    }

    const _injects = await processInjects(injects, mappings, ctx)
    const _args = pushInjects(args, _injects, result)

    // console.log(cmd, _cmd)
    // console.log('args', args)
    // console.log('_args=', _args)
    // console.log('_injects=', _injects)

    result = await _cmd(..._args) as T
    // console.log(cmd, 'result=', result)

    i++
    pipe = pipeline[i]
  }

  return result as T
}

export const processData = (...chunks: any[]) =>
  chunks.length === 1
    ? chunks[0]
    : expand(chunks.reduce((m, v, k) => {
      if (v === VARARG) {
        const key = chunks[k + 1]
        const rest = chunks.slice(k + 2)
        const next = rest.indexOf(VARARG)
        const values = next === -1 ? rest : rest.slice(0, next)
        m[key] = values.length === 1 ? values[0] : values.join('')
      }

      return m
    }, {}))

export const pushInjects = (args: any[], injects: Record<string, any>, result: any): any[] => [
  ...(result === DROP ? [] : [result]),
  ...args.flatMap(chunk =>
    typeof chunk === 'string'
      ? processArg(chunk, injects)
      : chunk
  )
]

export const processArg = (arg: string, injects: Record<string, any>): string | any[] => {
  const chunks = arg.split(/(\$\w+(?:\.\w+)*(?:\.(?=\.))?)/g).map((m, i) => {
    if (i % 2 === 0) return m || undefined

    return injects[m]
  })
    .filter(v => v !== undefined)

  return chunks.length === 1 ? chunks[0] : chunks.join('')
}

export const processInjects = async (injects: TInjects, mappings: Record<string, string>, ctx: TProcessContext): Promise<Record<string, any>> =>
  Object.fromEntries(
    await Promise.all(Object.values(injects).map(async ({raw, ref, path}) =>
      ([raw, get(await process(ctx, mappings[ref]), path)]))))
