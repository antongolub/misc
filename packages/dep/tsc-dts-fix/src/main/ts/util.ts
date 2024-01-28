
export const camelizeRecord = (flags: Record<string, any>) =>
  Object.fromEntries(Object.entries(flags).map(([k, v]) => ([
    k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
    v
  ])))

export const findCommon = (files: string[]) =>
  files[0].slice(0, [...(files[0])].findIndex((c, i) => files.some(f => f.charAt(i) !== c)))

export const logValue = (any: any) => { console.log(any); return any }
