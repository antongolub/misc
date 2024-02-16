import {TRules, TStrategy, TExtendCtx, TExtendOpts} from './interface.js'
import {getProps, getSeed, isObject, match} from './util.js'

export const getRule = (p: string, rules: TRules) =>
  rules[Object.keys(rules).find(k => match(p, k)) as string] || rules['*'] || TStrategy.OVERRIDE

export const extend = (opts: TExtendOpts) => {
  const {
    sources= [],
    rules = {},
    prefix = '',
    index = {}
  } = opts
  const result: any = (index[prefix] = index[prefix] || getSeed(sources[0]))
  const ctx = {result, sources, prefix, rules, index}

  return Array.isArray(result)
    ? extendArray(ctx)
    : extendObject(ctx)
}

export const extendArray = ({result, sources, prefix, rules}: TExtendCtx & {result: Array<any>}) => {
  const rule = getRule(prefix, rules)
  if (rule === TStrategy.IGNORE) return result
  if (rule === TStrategy.MERGE) {
    result.push(...sources.flat(1))
  } else {
    result.length = 0
    result.push(...sources.slice(-1).flat(1))
  }

  return result
}

export const extendObject = ({result, sources, prefix, rules, index}: TExtendCtx & {result: Record<string, any>}) => {
  for (const source of sources) {
    for (const key of getProps(source)) {
      const p = `${prefix ? prefix + '.' : ''}${key as string}`
      const rule = getRule(p, rules)
      const value = source[key as string]

      if (rule === TStrategy.IGNORE) continue

      result[key] = isObject(value) && rule === TStrategy.MERGE
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
