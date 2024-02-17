export type TPopulateOpts = {
  cwd?:     string
  extends?: TExtendsDeclaration
  rules?:   TRules
  root?:    string
  load?:    TLoad
  resolve?: TResolve
  parse?:   TParse
  merge?:   TMerge
  prepare?: TPrepare
  vmap?:    TVmap
}

export type TPopulate = (config: any, opts?: TPopulateOpts | TRules) => any

export type TCtx = {
  sync:     boolean
  cwd:      string
  root:     string
  populate: TPopulate
  resolve:  TResolve
  load:     TLoad
  merge:    TMerge
  prepare:  TPrepare
  parse:    TParse
  vmap?:    TVmap
  rules:    TRules
  extends?: TExtendsDeclaration
  extendKeys: string[]
  cache:    Map<string, any>
  config:   any
}

export type THelperCtx = {
  id:   string
  cwd:  string
  root: string
  sync: boolean
}

export type TExtendsDeclaration =  string | Record<any, any> | Array<string | Record<any, any>>
export type TLoad =     (ctx: THelperCtx & {resolved: string}) => any
export type TResolve =  (ctx: THelperCtx) => string
export type TMerge =    (...args: any[]) => any
export type TPrepare =  <T = any>(any: T, opts?: TPrepareOpts<T>) => T
export type TParse =    (ctx: THelperCtx & {contents: string, ext: string}) => any
export type TVmap =     (ctx: TVmapCtx) => any

export enum TStrategy {
  OVERRIDE =  'override',
  MERGE =     'merge',
  POPULATE =  'populate',
  IGNORE =    'ignore',
  REBASE =    'rebase',
}

export type TRules = Record<string, TStrategy | `${TStrategy}`>

export type TExtendCtx = {
  sources:  Record<string, any>[]
  rules:    TRules
  prefix:   string
  index:    Record<string, any>
  result:   any
}

export type TExtendOpts = Partial<TExtendCtx>

export type TVmapCtx = {
  value:    any
  key:      string | symbol
  prefix:   string
  resource: any
  cwd:      string
  root:     string
  id?:      string
}

export type TPrepareCtx<T> = Partial<THelperCtx> & {
  value:      T
  memo?:      Map<any, any>
  seed?:      any
  vmap?:      TVmap
  prefix?:    string
  resource?:  any
}

export type TPrepareOpts<T> = Pick<TPrepareCtx<T>, 'vmap' | 'cwd' | 'id' | 'root'>
