export type TProtoConfig = null | string | number | TProtoConfig[] | Record<string, any>

export type TConfigDeclaration = {
  data: TProtoConfig,
  sources: Record<any, TProtoConfig>
}

export type TDirective = {
  provider: string,
  args: string[],
  refs: string[]
}

export type TConfigGraph = {
  edges: [string, string][]
  vertexes: Record<string, TDirective[]>
}
