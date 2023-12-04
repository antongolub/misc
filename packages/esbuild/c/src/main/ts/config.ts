import { cosmiconfig } from 'cosmiconfig'
import * as path from 'node:path'
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

type ExtraLoader = (id: string, cwd: string) => any
type ExtraMerger = (...args: any[]) => any
type ExtraCloner = <T = any>(any: T) => T

export const loadExtra = async ({cwd = process.cwd(), id, merge, load = async (id, cwd) => (await import(path.resolve(cwd, id)))?.default}: {cwd?: string, id: string, load?: ExtraLoader, merge?: ExtraMerger}) => {
  const extra = (await load(id, cwd))
  const _cwd = path.dirname(path.resolve(cwd, id))

  return populateExtras(extra, {
    cwd: _cwd,
    load,
    merge
  })
}

export const populateExtras = async (config: any, {
  cwd = process.cwd(),
  load,
  merge = Object.assign,
  clone = v => JSON.parse(JSON.stringify(v))
}: {
  cwd?: string,
  load?: ExtraLoader,
  merge?: ExtraMerger
  clone?: ExtraCloner
}) => {
  const extras = config?.extends

  if (!extras) {
    return config
  }

  const _extras: any[] = await Promise.all(asArray(extras).map(id => loadExtra({cwd, id, load})))
  const sources: any[] = [
    clone({...config, extends: undefined}),
    ..._extras
  ]

  return merge({}, ...sources)
}
