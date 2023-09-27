
// https://github.com/microsoft/TypeScript/issues/14174#issuecomment-311335205
export type TData = number | string | { [key: string | number]: TData }

export type TConfigDeclaration = {
  data: TData,
  sources: Record<string, string | TConfigDeclaration>
}

export type TDirective = {
  cmd: string,
  args: string[],
  refs: string[]
  mappings: Record<string, string>
}

export type TConfigGraph = {
  edges: [string, string][]
  vertexes: Record<string, TDirective[]>
}
