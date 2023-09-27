
// https://github.com/microsoft/TypeScript/issues/14174#issuecomment-311335205
export type TData = number | string | { [key: string | number]: TData }

export type TConfigDeclaration = {
  data: TData,
  sources: Record<string, string | TConfigDeclaration>
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
