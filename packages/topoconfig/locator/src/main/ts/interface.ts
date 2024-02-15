export type TRepo = {
  owner: string
  name: string
  host?: string
}

export type TReferenceKind = 'uri' | 'fs' | 'npm' | 'github' | 'gitlab' // gitea

export type TReference = {
  kind: TReferenceKind
  file: string
  repo?: TRepo
  rev?: string // branch, tag, commit, version
  defaults?: TDefaults // attached defaults
}

type TDefaults = {
  file?: string
  ext?: string
  rev?: string
}

export type TParseOpts = {
  defaults?: TDefaults
}

export type TStringifyOpts = {
  format?: 'renovate' | 'github'
  omitDefaults?: boolean
  short?: boolean // omit defaults alias
  defaults?: TDefaults
}

