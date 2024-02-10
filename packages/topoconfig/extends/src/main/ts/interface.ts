export type PopulateOpts = {
  cwd?: string
  load?: ExtraLoader
  resolve?: ExtraResolver
  parse?: ExtraParser
  merge?: ExtraMerger
  clone?: ExtraCloner
  extends?: ExtendsDeclaration
  rules?: Rules
}

export type Populate = (config: any, opts?: PopulateOpts | Rules) => any

export type Ctx = {
  cwd: string
  populate: Populate
  resolve: ExtraResolver
  load: ExtraLoader
  merge: ExtraMerger
  clone: ExtraCloner
  parse: ExtraParser
  rules: Rules
  extends?: ExtendsDeclaration
  extendKeys: string[]
  cache: Map<string, any>
  config: any
}

export type ExtendsDeclaration = string | Record<any, any> | Array<string | Record<any, any>>
export type ExtraLoader = (resolved: string, id: string, cwd: string) => any
export type ExtraResolver = (id: string, cwd: string) => string
export type ExtraMerger = (...args: any[]) => any
export type ExtraCloner = <T = any>(any: T) => T
export type ExtraParser = (id: string, contents: string, ext: string) => any

export enum Strategy {
  OVERRIDE = 'override',
  MERGE = 'merge',
  POPULATE = 'populate'
}

export type Rules = Record<string, Strategy | `${Strategy}`>

export type TExtendCtx = {
  sources: Record<string, any>[]
  rules: Rules
  prefix: string
  index: Record<string, any>
  result: any
}

export type TExtendOpts = Partial<TExtendCtx>