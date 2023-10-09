
// https://github.com/microsoft/TypeScript/issues/14174#issuecomment-311335205
export type TData = number | string | { [key: string]: TData } | { [key: number]: TData }

export type TCmd = (...opts: any[]) => any

export type TCmds = Record<string | symbol, TCmd>

export type TConfigDeclaration = {
  data:       TData,
  sources?:   Record<string, string | TConfigDeclaration>
  cmds?:      TCmds
}

export type TProcessContext = {
  pipelines:  Record<string, TPipeline>
  edges:      [string, string][]
  cmds:       Record<string | symbol, TCmd>
  values:     Record<string, Promise<any> | undefined>
}

export type TParseContext = {
  prefix:     string
  pipelines:  Record<string, TPipeline>
  edges:      [string, string][]
  nodes:      string[]
  parent?:    TParseContext
}

export type TInject = {
  raw:        string
  ref:        string   // points to node
  path:       string   // holds value dot-prop path
}

export type TInjects = Record<string, TInject>

export type TDirective = {
  op?:        undefined
  cmd:        string | symbol
  args:       any[]
  injects:    TInjects
  mappings:   Record<string, string>
}

export type TOperator = {
  op: string
}

export type TPipeline = Array<TOperator | TDirective>

export type TConfigGraph = {
  edges:      [string, string][]
  pipelines:  Record<string, TPipeline>
}
