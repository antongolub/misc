import minimist from 'minimist'

export type TOpts = minimist.Opts & {
  split?: (string | string[])[]
}

export const envimist = (env: Record<string, string | undefined> = process.env, opts: TOpts = {}) => {
  const splitMap = getSplitMap(opts.split)

  return Object.fromEntries(Object.entries(minimist(envToVararg(env), opts))
    .map(([k, v]) => {
      const sep = splitMap[k]
      if (sep) {
        return [k, split(v, sep)]
      }

      return [k, v]
    }))
}


export default envimist

const getSplitMap = (split: TOpts['split']): Record<string, string> => Object.fromEntries(split?.map(entry => {
  if (Array.isArray(entry)) {
    const vars = entry.slice(0, -1)
    const sep = entry.slice(-1)

    return vars.map(v => [v, sep])
  }

  return [[entry, ',']]
}).flat() || [])

const envToVararg = (env: Record<string, string | undefined>): string[] => {
  const envs = Object.entries(env)
  const args: string[] = []

  for (const [key, value] of envs) {
    if (value === undefined) {
      continue
    }
    args.push(`--${normalizeKey(key)}`, value)
  }

  return args
}

const normalizeKey = (key: string) => key.toLowerCase().replaceAll('_', '-')

const split = (value: string, sep = ','): string[] => value.split(sep)
