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

export type TParseOpts = {
  defaults?: {
    repo?: TRepo
    file?: string
    ext?: string
    rev?: string
  }
}

export type TStringifyOpts = {
  format?: 'renovate' | 'github'
}

