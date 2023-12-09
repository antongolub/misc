export type TKeeperCtx = {
  cwd:        string
  resources:  TResource[]  // resources to process: package.json, requirements.txt, etc.
  proposals:  TProposal[]
  configs:    TConfig[]
  // include:    string[]  // dep list to pick. Common logic if empty: pick all
  // exclude:    string[]  // dep list to ignore
  // limit:      number    // max number of deps to update in one run
  // offset:     number    // offset to start from
  // batch:      number    // max number of updates in a single proposal/commit
}

export type TResource = {
  name:     string
  contents: any
  locked?:  boolean
}

export type TConfig = {
  keeper:   string
  options:  Record<string, any>
}

export type TKeeper = {
  propose:  (ctx: TKeeperCtx) => Promise<TKeeperCtx>  // proposes a list of updates
  perform:  (ctx: TKeeperCtx) => Promise<void>        // updates the target resources
}

export type TProposal<D = any> = {
  keeper:   string
  action:   'add' | 'remove' | 'update'
  resource: string
  data:     D
}

export type TDepPatch = TProposal<{
  name:     string
  version?: string
  scope?:   string
}>
