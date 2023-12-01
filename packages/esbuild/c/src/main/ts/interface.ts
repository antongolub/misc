import type { Plugin } from 'esbuild'

export type { Plugin } from 'esbuild'

export type PluginOptions = any

export type PluginFactory = (options?: PluginOptions) => Plugin

export type EsbuildConfigRaw = {
  plugins?: (string | [string, PluginOptions?] | Plugin | PluginFactory)[]
  [key: string]: any
}

export type EsbuildConfig = {
  plugins: Plugin[]
  [key: string]: any
}
