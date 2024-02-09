import {Rules, TExtendCtx, TExtendOpts} from './interface.js'
import {isObject} from './util.js'

export const MERGE = 'merge'
export const OVERRIDE = 'override'

const getRule = (p: string, rules: Rules) => rules[p] || rules['*'] || OVERRIDE

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

export const extendArray = ({result, sources, prefix, rules}: TExtendCtx & {result: Array<any>}) => {
  if (getRule(prefix, rules) === MERGE) {
    result.push(...sources.flat(1))
  } else {
    result.length = 0
    result.push(...sources.slice(-1).flat(1))
  }

  return result
}

export const extendObject = ({result, sources, prefix, rules, index}: TExtendCtx & {result: Record<string, any>}) => {
  for (const source of sources) {
    for (const key in source) {
      const p = `${prefix ? prefix + '.' : ''}${key}`
      const rule = getRule(p, rules)
      const value = source[key]

      result[key] = isObject(value) && rule === MERGE
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

export const dextend = (v: any) => {
  delete v?.extends
  return v
}
