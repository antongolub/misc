export type TRepoKind = 'github' | 'gitlab' // gitea

export type TRepo = {
  kind: TRepoKind
  owner: string
  name: string
  host?: string
}

export type TReference = {
  file: string
  repo?: TRepo
  rev?: string // branch, tag, commit, version
}

export type TParseOpts = {
  file?: string
  ext?: string
}

