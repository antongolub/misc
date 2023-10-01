
// https://github.com/microsoft/TypeScript/issues/14174#issuecomment-311335205
export type TData = number | string | { [key: string]: TData } | { [key: number]: TData }

export type TConfigDeclaration = {
  data: TData,
  sources: Record<string, string | TConfigDeclaration>
}

export type TDirective = {
  op?: undefined
  cmd: string,
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
