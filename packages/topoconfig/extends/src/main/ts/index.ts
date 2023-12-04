import path from 'node:path'

type ExtraLoader = (id: string, cwd: string) => any
type ExtraMerger = (...args: any[]) => any
type ExtraCloner = <T = any>(any: T) => T

export type ExtendStrategy = 'override' | 'merge'

type Rules = Record<string, ExtendStrategy>

type TExtendCtx = {
  sources: Record<string, any>[]
  rules: Rules
  prefix: string
  index: Record<string, any>
  result: any
}

export type TExtendOpts = Partial<TExtendCtx>

export const populate = async (config: any, {
  cwd = process.cwd(),
  load = async (id, cwd) => (await import(path.resolve(cwd, id)))?.default,
  merge,
  clone = v => JSON.parse(JSON.stringify(v)),
  extends: _extends
}: {
  cwd?: string
  load?: ExtraLoader
  merge?: ExtraMerger | Rules
  clone?: ExtraCloner
  extends?: string | Record<any, any> | Array<string | Record<any, any>>
} = {}) => {
  const extras = [config?.extends, _extends].flat(1).filter(Boolean)
  if (extras.length === 0) {
    return config
  }

  const _merge = typeof merge === 'function'
    ? merge
    : (...sources: any[]) => extend({
      sources,
      rules: merge
    })

  const _extras: any[] = await Promise.all(extras.map(id => loadExtra({cwd, id, load, merge: _merge, clone})))
  const sources: any[] = [
    clone({...config, extends: undefined}),
    ..._extras
  ]

  return _merge({}, ...sources)
}

const getRule = (p: string, rules: Rules) => rules[p] || rules['*'] || 'override'

const extendArray = ({result, sources, prefix, rules}: TExtendCtx & {result: Array<any>}) => {
  if (getRule(prefix, rules) === 'merge') {
    result.push(...sources.flat(1))
  } else {
    result.length = 0
    result.push(...sources.slice(-1).flat(1))
  }

  return result
}

const extendObject = ({result, sources, prefix, rules, index}: TExtendCtx & {result: Record<string, any>}) => {
  for (const source of sources) {
    for (const key in source) {
      const p = `${prefix ? prefix + '.' : ''}${key}`
      const rule = getRule(p, rules)
      const value = source[key]

      result[key] = isObject(value) && rule === 'merge'
        ? extend({
          sources: [value],
          rules,
          prefix: p,
          index
        })
        : value
    }
  }

  return result
}

export const extend = (opts: TExtendOpts) => {
  const {
    sources= [],
    rules = {},
    prefix = '',
    index = {}
  } = opts
  const isArray = Array.isArray(index[prefix] || sources[0])
  const result: any = (index[prefix] = index[prefix] || (isArray ? [] : {}))
  const ctx = {result, sources, prefix, rules, index}

  return isArray
    ? extendArray(ctx)
    : extendObject(ctx)
}

const isObject = (value: any) => typeof value === 'object' && value !== null

const loadExtra = async ({
  cwd = process.cwd(),
  id,
  merge,
  clone,
  load
}: {
  cwd?: string
  id: any
  clone?: ExtraCloner
  load: ExtraLoader
  merge?: ExtraMerger
}) => {
  if (typeof id !== 'string') {
    return populate(id, {cwd, load, merge, clone})
  }

  const extra = (await load(id, cwd))
  const _cwd = path.dirname(path.resolve(cwd, id))

  return populate(extra, {
    cwd: _cwd,
    load,
    merge
  })
}
