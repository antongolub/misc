import minimist from 'minimist'

export const envimist = (env: Record<string, string | undefined> = process.env, opts?: minimist.Opts) =>
  minimist(envToVararg(env), opts)

export default envimist

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
