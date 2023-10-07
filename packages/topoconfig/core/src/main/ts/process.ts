import {TCmds, TDirective, TOperator, TProcessContext} from './interface'
import {DATA, DROP, VARARG} from './constants'
import {expand, get, getPromise} from './util.ts'

export const process = async <T = any>(ctx: TProcessContext, vertex = ''): Promise<T> => {
  const {vertexes, edges, cmds: _cmds, values} = ctx
  if (values[vertex]) {
    return values[vertex]
  }

  const cmds: TCmds = {[DATA]: processData, ..._cmds}
  const { promise, resolve, reject} = getPromise<T>()
  const pipeline = vertexes[vertex]
  if (!pipeline) {
    throw new Error(`Unknown vertex: ${vertex}`)
  }

  values[vertex] = promise

  let i = 0
  let pipe: TDirective | TOperator | undefined = pipeline[i]
  let result: T | symbol = DROP
  let err: any

  while (pipe) {
    const {op} = pipe
    if (typeof op === 'string') {
      pipe = undefined
      continue
    }

    const {cmd, refs, mappings, args} = pipe
    const _cmd = cmds[cmd]
    if (!_cmd) {
      throw new Error(`cmd not found: ${String(cmd)}`)
    }

    const _refs = await processRefs(refs, mappings, ctx)
    const _args = injectRefs(args, _refs, result)

    // console.log(cmd, _cmd)
    // console.log('args', args)
    // console.log('_args=', _args)
    // console.log('_refs=', _refs)

    result = await _cmd(..._args) as T
    // console.log(cmd, 'result=', result)

    i++
    pipe = pipeline[i]
  }

  resolve(result as T)

  return promise
}

export const processData = (...chunks: any[]) =>
  chunks.length === 1
    ? chunks[0]
    : expand(chunks.reduce((m, v, k) => {
      if (v === VARARG) {
        const key = chunks[k + 1]
        const rest = chunks.slice(k + 2)
        const next = rest.findIndex(c => c === VARARG)
        const values = next === -1 ? rest : rest.slice(0, next)
        m[key] = values.length === 1 ? values[0] : values.join('')
      }

      return m
    }, {}))

export const injectRefs = (args: any[], refs: Record<string, any>, result: any): any[] => [
  ...(result === DROP ? [] : [result]),
  ...args.flatMap(chunk =>
    typeof chunk === 'string'
      ? chunk.split(/(\$\w+(?:.\w+)*(?:\.(?=\.))?)/g).map((m, i) => {
        if (i % 2 === 0) return m || undefined

        const d = m.indexOf('.')
        const [r, p] = d === -1 ? [m.slice(1), '.'] : [m.slice(1, d), m.slice(d + 1)]

        return get(refs[r], p, m)
      })
        .filter(v => v !== undefined)
      : chunk
  )
]

export const processRefs = async (refs: string[], mappings: Record<string, string>, ctx: TProcessContext) =>
  (await Promise.all(refs.map(async v => ({[v]: await process(ctx, mappings[v])}))))
    .reduce((m, mixin) => Object.assign(m, mixin), {})