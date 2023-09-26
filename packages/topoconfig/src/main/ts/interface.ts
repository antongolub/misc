export type TProtoConfig = null | string | number | TProtoConfig[] | Record<string, any>

export type TConfigOpts = {
  data: TProtoConfig,
  sources?: Record<any, TProtoConfig>
}

export type TDirective = {
  provider: string,
  args: string[],
  refs: string[]
}
