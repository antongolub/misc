import path from 'node:path'

import {
  Rules,
  TExtendOpts,
  TExtendCtx,
  ExtraMerger,
  Ctx,
  ExtraCloner,
  ExtraLoader, PopulateOpts, Populate,
} from "./interface.js";

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

export const loadExtra = <P extends (...args: any[]) => any>({
  cwd = process.cwd(),
  id,
  merge,
  clone,
  load,
  populate
}: {
  cwd?: string
  id: any
  clone?: ExtraCloner
  load: ExtraLoader
  merge?: ExtraMerger
  populate: P
}) => {
  if (typeof id !== 'string') {
    return populate(id, {cwd, load, merge, clone})
  }

  const extra = load(id, cwd)
  const _cwd = path.dirname(path.resolve(cwd, id))

  return populate(extra, {
    cwd: _cwd,
    load,
    merge
  })
}

export const normalizeOpts = (opts: PopulateOpts, loader: ExtraLoader, populate: Populate): Ctx =>
  ({
    cwd: process.cwd(),
    load: loader,
    clone: v => JSON.parse(JSON.stringify(v)),
    ...opts,
    merge: buildMerger(opts.merge),
    populate
  })

const buildMerger = (merge?: ExtraMerger | Rules): ExtraMerger => typeof merge === 'function'
  ? merge
  : (...sources: any[]) => extend({
    sources,
    rules: merge
  })

export const loadExtras = (config: any, opts: Ctx): any[] => {
  const extras = [config?.extends, opts.extends].flat(1).filter(Boolean)

  return extras.map(id => loadExtra({id, ...opts}))
}

export const assembleValue = (config: any, extras: any[], clone: ExtraCloner, merge: ExtraMerger ) => {
  const sources: any[] = [
    clone({...config, extends: undefined}),
    ...extras
  ]

  return merge({}, ...sources)
}