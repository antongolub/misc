export type TKeeperCtx = {
  keeper:     string
  cwd:        string
  resources:  TResource[]  // resources to process: package.json, requirements.txt, etc.
  proposals:  TProposal[]
  config:     TKeeperOptionsNormalized
}

export type TResource = {
  name:       string
  contents:   any
  locked?:    boolean
}

export type TKeeper = {
  propose:    (ctx: TKeeperCtx) => Promise<TKeeperCtx>  // proposes a list of updates
  script:     (ctx: TKeeperCtx) => Promise<TKeeperCtx>  // prepares scripts for updates and attaches them to proposals
}

export type TProposal<D = any> = {
  keeper:     string
  action:     'add' | 'remove' | 'update'
  resource:   string
  data:       D
  script?:    string
}

export type TKeeperOptions = {
  cwd?:       string
  resources?: string | string[]
  include?:   string | string[]
  exclude?:   string | string[]
  [index: string]: any
}

export type TKeeperOptionsNormalized = TKeeperOptions & {
  cwd:        string
  resources:  string[]
  include:    string[]
  exclude:    string[]
}

export type TKeeperConfig = {
  keeper:     string
  options:    TKeeperOptions
}

export type TKeeperConfigNormalized = {
  keeper:     string
  options:    TKeeperOptionsNormalized
}

export type TConfigDeclaration =
  string |
  [string, TKeeperOptions] |
  TKeeperConfig

export type TConfig = {
  granularity?: TGranularity
  keepers?:     TConfigDeclaration[]
}

export type TConfigNormalized = {
  granularity:  TGranularity
  keepers:      TKeeperConfigNormalized[]
}

export type TGranularity = 'proposal' | 'common' | 'resource' | 'all-in'
