export type TProtoConfig = null | string | number | TProtoConfig[] | Record<string, any>

export type TConfigOpts = {
  data: TProtoConfig,
  sources?: Record<any, TProtoConfig>
}
