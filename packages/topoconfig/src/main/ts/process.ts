import {TDirective, TOperator, TPipeline} from './interface'

export type TCmd = (...opts: any[]) => any

export type TProcessContext = {
  vertexes: Record<string, TPipeline>
  edges: [string, string][]
  cmds: Record<string, TCmd>
  values: Record<string, Promise<any> | undefined>
}

type TPromiseAction<T = any> = (value: T | PromiseLike<T>) => void

const drop = Symbol('drop')

const getPromise = <T = any>() => {
  let resolve: TPromiseAction<T> = () => {}
  let reject: TPromiseAction<T> = () => {}
  const promise = new Promise<T>((...args) => { [resolve, reject] = args })

  return {
    reject,
    resolve,
    promise
  }
}

// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_get
const get = (obj: any, path: string, defaultValue = undefined) => {
  if (!path) return obj
  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj)
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/)
  return result === undefined || result === obj ? defaultValue : result
}

export const process = async <T = any>(ctx: TProcessContext, vertex = ''): Promise<T> => {
  const {vertexes, edges, cmds, values} = ctx
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
  let result: T | symbol = drop
  let err: any

  while (pipe) {
    const {op} = pipe
    if (typeof op === 'string') {
      pipe = undefined
      continue
    }

    const {cmd, refs, mappings, args} = pipe
    const _cmd = cmds[cmd]
    const _refs = (await Promise.all(refs.map(async v => ({[v]: await process(ctx, mappings[v])}))))
      .reduce((m, mixin) => Object.assign(m, mixin), {})

    const _args = [
      ...(result === drop ? [] : [result]),
      ...args.map(chunk =>
        /^\$\w+$/.test(chunk)
          ? _refs[chunk.slice(1)]
          : chunk
            .replace(
              /"\$(\w+)(\.[^" ]+)?"/g,
              (_, $1, $2) => JSON.stringify(get(_refs[$1], $2))
            )
      )
    ]

    console.log(cmd, _cmd)
    console.log('args', _args)

    result = await _cmd(..._args) as T
    resolve(result)

    console.log('result', result)

    i++
    pipe = pipeline[i]
  }


  return promise
}

