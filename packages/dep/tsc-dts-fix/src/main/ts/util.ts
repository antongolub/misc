
export const camelizeRecord = (flags: Record<string, any>) =>
  Object.fromEntries(Object.entries(flags).map(([k, v]) => ([
    k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
    v
  ])))

export const findBase = (files: string[]) => {
  const first = files[0]

  if (files.length === 0) return ''
  if (files.length === 1) return first.slice(0, first.lastIndexOf('/') + 1)

  // eslint-disable-next-line
  return first.slice(0, first.split('').findIndex((c, i) => files.some(f => f.charAt(i) !== c)))
}

export const logValue = (any: any) => { console.log(any); return any }
