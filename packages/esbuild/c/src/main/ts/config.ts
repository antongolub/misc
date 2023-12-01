import { cosmiconfig } from 'cosmiconfig'
import { asArray } from './util.js'
import type {
  EsbuildConfig,
  EsbuildConfigRaw,
  PluginFactory,
  PluginOptions,
  Plugin
} from './interface.js'

export const loadConfig = async ({cwd = process.cwd(), searchPlaces}: {
  cwd?: string
  searchPlaces?: string[] | string
}): Promise<EsbuildConfig> => {
  const rawConfig: EsbuildConfigRaw = (await cosmiconfig('esbuild', {
    searchPlaces: searchPlaces ? asArray(searchPlaces) : undefined
  }).search(cwd))?.config || {}

  console.log(searchPlaces, rawConfig)

  return normalizeConfig(rawConfig)
}

export const normalizeConfig =  async (config: EsbuildConfigRaw): Promise<EsbuildConfig> => {
  const plugins = await Promise.all((config.plugins ? asArray(config.plugins) : [])
    .map(loadPlugin))

  return {
    plugins
  }
}

export const loadPlugin = async (plugin: string | [string, PluginOptions?] | Plugin | PluginFactory): Promise<Plugin> => {
  if (Array.isArray(plugin) || typeof plugin === 'string') {
    const [name, options] = asArray(plugin)
    const module = await import(name)
    const factory: PluginFactory = module.default?.default || module.default

    return factory(options)
  }

  if (typeof plugin === 'function') {
    return plugin()
  }

  return plugin

}
