import process from 'node:process'
import {
  TConfig,
  TConfigDeclaration,
  TConfigNormalized,
  TKeeperConfig,
  TKeeperConfigNormalized,
  TKeeperCtx
} from './interface.ts'
import {asArray} from './util.ts'

export const normalizeConfig = (raw: TConfig): TConfigNormalized => {
  const granularity = raw.granularity || 'proposal'
  const keepers = normalizeKeepers(raw.keepers)

  return {
    granularity,
    keepers,
    dryrun:   !!raw.dryrun,
    combine:  !!raw.combine,
    output:   raw.output,
    pre:      raw.pre,
    post:     raw.post,
  }
}

export const normalizeKeepers = (raw: TConfigDeclaration[] = []): TKeeperConfigNormalized[] =>
  raw.map(value => {
    const [keeper, opts] = typeof value === 'string'
      ? [value, {}]
      : Array.isArray(value)
        ? value
        : [(value as TKeeperConfig).keeper, (value as TKeeperConfig).options]

    return {keeper, options: normalizeOptions(opts)}
  })

export const normalizeCtx = ({cwd, config: {keeper, options: config}}: {cwd: string, config: TKeeperConfigNormalized}): TKeeperCtx =>
  ({
    cwd:        cwd || process.cwd(),
    keeper,
    config,
    resources:  [],
    proposals:  []
  })

export const normalizeOptions = (options: Record<string, any> = {}) => ({
  cwd:        process.cwd(),
  ...options,
  include:    asArray(options.include || options.match),
  exclude:    asArray(options.exclude || options.ignore),
  resources:  asArray(options.resources)
})
