export const asArray = <T>(value: T): Array<T extends Array<any> ? T[number] : T> =>
  (Array.isArray(value) ? value : [value]) as any

export const isObject = (value: any) => typeof value === 'object' && value !== null

type ExtendStrategy = 'override' | 'merge'

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
  const result: any = (index[prefix] = index[prefix] || Array.isArray(sources[0]) ? [] : {})
  for (const source of sources) {
    for (const key in source) {
      const p = `${prefix ? prefix + '.' : ''}${key}`
      const rule = rules[p] || rules['*'] || 'override'
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
