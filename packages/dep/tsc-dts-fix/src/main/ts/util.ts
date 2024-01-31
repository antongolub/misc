import path from 'node:path'

export const camelizeRecord = (flags: Record<string, any>) =>
  Object.fromEntries(Object.entries(flags).map(([k, v]) => ([
    k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
    v
  ])))

export const findBase = (files: string[]) => {
  const first = files[0]
  const dirname = (f: string) => f.endsWith('/') ? f : path.dirname(f) + '/'

  if (files.length === 0) return ''
  if (files.length === 1) return dirname(first)

  // eslint-disable-next-line
  return dirname(first.slice(0, first.split('').findIndex((c, i) => files.some(f => f.charAt(i) !== c))))
}

export const logValue = (any: any) => { console.log(any); return any }
