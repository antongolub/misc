import {TRules, TStrategy, TExtendCtx, TExtendOpts} from './interface.js'
import {getProps, getSeed, isObject} from './util.js'

const getRule = (p: string, rules: TRules) => rules[p] || rules['*'] || TStrategy.OVERRIDE

export const extend = (opts: TExtendOpts) => {
  const {
    sources= [],
    rules = {},
    prefix = '',
    index = {}
  } = opts
  const isArray = Array.isArray(index[prefix] || sources[0])
  const result: any = (index[prefix] = index[prefix] || getSeed(sources[0]))
  const ctx = {result, sources, prefix, rules, index}

  return isArray
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

export const unsetExtends = (v: any, extendsKeys: string[]) => {
  for (const key of extendsKeys) {
    delete v?.[key]
  }
  return v
}
