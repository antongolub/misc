import {TCmds, TDirective, TOperator, TProcessContext} from './interface'
import {DATA, DROP} from './constants'
import {expand, get, getPromise} from './util.ts'

export const process = async <T = any>(ctx: TProcessContext, vertex = ''): Promise<T> => {
  const {vertexes, edges, cmds: _cmds, values} = ctx
  const cmds: TCmds = {
    [DATA]: processData,
    ..._cmds
  }
  if (values[vertex]) {
    return values[vertex]
  }
  const { promise, resolve, reject} = getPromise<T>()
  const pipeline = vertexes[vertex]

  values[vertex] = promise

  if (!pipeline) {
    throw new Error(`Unknown vertex: ${vertex}`)
  }

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

    const _refs = (await Promise.all(refs.map(async v => ({[v]: await process(ctx, mappings[v])}))))
      .reduce((m, mixin) => Object.assign(m, mixin), {})
    const _args = [
      ...(result === DROP ? [] : [result]),
      ...args.flatMap(chunk =>
        typeof chunk === 'string'
          ? chunk.split(/(\$[\w.]+)/g).map((m, i) => {
            if (i % 2 === 0) return m || undefined

            const d = m.indexOf('.')
            const [r, p] = d === -1 ? [m.slice(1), '.'] : [m.slice(1, d), m.slice(d + 1)]

            console.log('r=', r, 'p=', p, 'chunk=', chunk)

            return get(_refs[r], p, m)
          })
            .filter(v => v !== undefined)
          : chunk
        // /^\$\w+$/.test(chunk)
        //   ? _refs[chunk.slice(1,-1)]
        //   : chunk
        //     .replace(/"\$(\w+)(\.[^" ]+)?"/g, replacer)
        //     .replace(/\$(\w+)(\.[^" ]+)?/g, replacer)
      )
    ]

    console.log(cmd, _cmd)
    console.log('args', args)
    console.log('_args=', _args)
    console.log('_refs=', _refs)

    result = await _cmd(..._args) as T
    resolve(result)

    console.log('result', result)

    i++
    pipe = pipeline[i]
  }

  return promise
}

export const processData = (...chunks: any[]) =>
  chunks.length === 1
    ? chunks[0]
    : expand(chunks.reduce((m, v, k) => {
      if (k % 2) {
        m[chunks[k - 1]] = v
      }
      return m
    }, {}))
