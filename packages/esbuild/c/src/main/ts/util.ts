export const asArray = <T>(value: T): Array<T extends Array<any> ? T[number] : T> =>
  (Array.isArray(value) ? value : [value]) as any

export const splitNth = (str: string, sep: string, n = 1): [string, string] => {
  let i= 0
  const l = str.length

  while (n-- && i++ < l) {
    i = str.indexOf(sep, i)
    if (i < 0) break
  }

  if (i < 1) return [str, '']

  return [str.slice(0, i), str.slice(i + 1)]
}

export const toCamelCase = (str: string) => str.replace(/-([a-z])/g, (_, c) => c.toUpperCase())

export const objectToCamelCase = (obj: Record<string, any>) =>
  Object.fromEntries(Object.entries(obj).map(([k, v]) => [toCamelCase(k), v]))
