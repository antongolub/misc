import { cosmiconfig } from 'cosmiconfig'
import { asArray } from './util.ts'
import { populate } from '@topoconfig/extends'
import type {
  EsbuildConfig,
  EsbuildConfigRaw,
  PluginFactory,
  PluginOptions,
  Plugin
} from './interface.ts'

export const loadConfig = async ({cwd = process.cwd(), searchPlaces}: {
  cwd?: string
  searchPlaces?: string[] | string
}): Promise<EsbuildConfig> => {
  const rawConfig: EsbuildConfigRaw = (await cosmiconfig('esbuild', {
    searchPlaces: searchPlaces ? asArray(searchPlaces) : undefined
  }).search(cwd))?.config || {}

  // console.log(searchPlaces, rawConfig)

  return normalizeConfig(rawConfig)
}

export const normalizeConfig =  async (config: EsbuildConfigRaw): Promise<EsbuildConfig> => {
  const plugins = await Promise.all((config.plugins ? asArray(config.plugins) : [])
    .map(loadPlugin))

  return await populate({
    ...config,
    plugins
  }, {})
}

export const loadPlugin = async (plugin: string | [string, PluginOptions?] | Plugin | PluginFactory): Promise<Plugin> => {
  if (Array.isArray(plugin) || typeof plugin === 'string') {
    const [name, options] = asArray(plugin)
    const module = await import(name)
    const factory: PluginFactory = module.default?.default || module.default

    return factory?.(options)
  }

  if (typeof plugin === 'function') {
    return plugin()
  }

  return plugin
}
