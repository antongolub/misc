
// https://github.com/microsoft/TypeScript/issues/14174#issuecomment-311335205
export type TData = number | string | { [key: string]: TData } | { [key: number]: TData }

export type TCmd = (...opts: any[]) => any

export type TCmds = Record<string | symbol, TCmd>

export type TConfigDeclaration = {
  data: TData,
  sources: Record<string, string | TConfigDeclaration>
  cmds?: TCmds
}

export type TProcessContext = {
  vertexes: Record<string, TPipeline>
  edges: [string, string][]
  cmds: Record<string | symbol, TCmd>
  values: Record<string, Promise<any> | undefined>
}

export type TDirective = {
  op?: undefined
  cmd: string | symbol,
  args: string[],
  refs: string[]
  mappings: Record<string, string>
}

export type TOperator = {
  op: string
}

export type TPipeline = Array<TOperator | TDirective>

export type TConfigGraph = {
  edges: [string, string][]
  vertexes: Record<string, TPipeline>
}
