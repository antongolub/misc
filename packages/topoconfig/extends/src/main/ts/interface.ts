export type TPopulateOpts = {
  cwd?:     string
  root?:    string
  load?:    TLoad
  resolve?: TResolve
  parse?:   TParse
  merge?:   TMerge
  clone?:   TClone
  extends?: TExtendsDeclaration
  rules?:   TRules
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
  clone:    TClone
  parse:    TParse
  rules:    TRules
  extends?: TExtendsDeclaration
  extendKeys: string[]
  cache:    Map<string, any>
  config:   any
}

export type HelperCtx = {
  id:   string
  cwd:  string
  root: string
  sync: boolean
}

export type TExtendsDeclaration =  string | Record<any, any> | Array<string | Record<any, any>>
export type TLoad =     (ctx: HelperCtx & {resolved: string}) => any
export type TResolve =  (ctx: HelperCtx) => string
export type TMerge =    (...args: any[]) => any
export type TClone =    <T = any>(any: T, opts?: TCloneOpts<T>) => T
export type TParse =    (ctx: HelperCtx & {contents: string, ext: string}) => any

export enum TStrategy {
  OVERRIDE =  'override',
  MERGE =     'merge',
  POPULATE =  'populate'
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

export type TCloneCtx<T> = Partial<HelperCtx> & {
  value:      T
  memo?:      Map<any, any>
  seed?:      any
  vmap?:      (ctx: TVmapCtx) => any
  prefix?:    string
  resource?:  any
}

export type TCloneOpts<T> = Pick<TCloneCtx<T>, 'vmap' | 'cwd' | 'id' | 'root'>
