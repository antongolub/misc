export type PopulateOpts = {
  cwd?: string
  load?: ExtraLoader
  merge?: ExtraMerger | Rules
  clone?: ExtraCloner
  extends?: ExtendsDeclaration
  rules?: Rules
}

export type Populate = (config: any, opts?: PopulateOpts | Rules) => any

export type Ctx = {
  cwd: string
  populate: Populate
  load: ExtraLoader
  merge: ExtraMerger
  clone: ExtraCloner
  extends?: ExtendsDeclaration
  config: any
}

export type ExtendsDeclaration = string | Record<any, any> | Array<string | Record<any, any>>
export type ExtraLoader = (id: string, cwd: string) => any
export type ExtraMerger = (...args: any[]) => any
export type ExtraCloner = <T = any>(any: T) => T

export type ExtendStrategy = 'override' | 'merge'

export type Rules = Record<string, ExtendStrategy>

export type TExtendCtx = {
  sources: Record<string, any>[]
  rules: Rules
  prefix: string
  index: Record<string, any>
  result: any
}

export type TExtendOpts = Partial<TExtendCtx>