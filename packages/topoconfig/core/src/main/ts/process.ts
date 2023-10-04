import {TCmds, TDirective, TOperator, TProcessContext} from './interface'
import {DATA, DROP} from './constants'

type TPromiseAction<T = any> = (value: T | PromiseLike<T>) => void

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
const get = <T = any>(obj: any, path: string, defaultValue?: any): T => {
  if (!path) return obj
  if (path.startsWith('.')) return get(obj, path.slice(1), defaultValue)

  const travel = (regexp: RegExp) =>
    String.prototype.split
      .call(path, regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj)
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/)
  return result === undefined || result === obj ? defaultValue : result
}

export const process = async <T = any>(ctx: TProcessContext, vertex = ''): Promise<T> => {
  const {vertexes, edges, cmds: _cmds, values} = ctx
  const cmds: TCmds = {
    [DATA]: JSON.parse,
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
    const replacer = (_: string, ref: string, path: string) => JSON.stringify(get(_refs[ref], path))
    const _args = [
      ...(result === DROP ? [] : [result]),
      ...args.map(chunk =>
        /^\$\w+$/.test(chunk)
          ? _refs[chunk.slice(1)]
          : chunk
            .replace(/"\$(\w+)(\.[^" ]+)?"/g, replacer)
            .replace(/\$(\w+)(\.[^" ]+)?/g, replacer)
      )
    ]

    // console.log(cmd, _cmd)
    // console.log('args', _args)

    result = await _cmd(..._args) as T
    resolve(result)

    // console.log('result', result)

    i++
    pipe = pipeline[i]
  }

  return promise
}
