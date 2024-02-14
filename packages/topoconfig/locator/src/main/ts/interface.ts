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
  defaults?: TDefaults
}

