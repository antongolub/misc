export const asArray = <T>(value: T): Array<T extends Array<any> ? T[number] : T> =>
  (Array.isArray(value) ? value : [value]) as any

export const isObject = (value: any) => typeof value === 'object' && value !== null

type ExtendStrategy = 'override' | 'merge'

const getRule = (p: string, rules: Record<string, string> = {}) => rules[p] || rules['*'] || 'override'

export const extend = ({
  sources,
  rules = {},
  prefix = '',
  index = {}
}: {
  sources: Record<string, any>[]
  rules?: Record<string, ExtendStrategy>
  prefix?: string
  index?: Record<string, any>
}) => {
  const isArray = Array.isArray(index[prefix] || sources[0])
  const result: any = (index[prefix] = index[prefix] || (isArray ? [] : {}))

  if (isArray) {
    if (getRule(prefix, rules) === 'merge') {
      result.push(...sources.flat(1))
    } else {
      result.length = 0
      result.push(...sources.slice(-1).flat(1))
    }
    return result
  }

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
