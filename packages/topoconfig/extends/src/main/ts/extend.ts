import {Rules, Strategy, TExtendCtx, TExtendOpts} from './interface.ts'
import {isObject} from './util.ts'

const getRule = (p: string, rules: Rules) => rules[p] || rules['*'] || Strategy.OVERRIDE

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
  if (getRule(prefix, rules) === Strategy.MERGE) {
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

      result[key] = isObject(value) && rule === Strategy.MERGE
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
