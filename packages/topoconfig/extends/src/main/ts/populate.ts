import path from 'node:path'

import {
  Rules,
  ExtraMerger,
  Ctx,
  ExtraLoader,
  PopulateOpts,
  Populate,
} from './interface.js'

import {load, loadSync, loadResource, resolve} from './load.js'
import {extend, dextend} from './extend.js'
import {isString} from './util.js'

export const populate = async <R = Record<any, any>>(config: any, opts: PopulateOpts | Rules = {}): Promise<R> => {
  const ctx = createCtx(config, opts, load, populate)
  const _config = await loadResource(ctx)
  const extras: any[] = await Promise.all(populateExtras(_config, ctx))

  return assembleValue(_config, extras, ctx)
}

export const populateSync = <R = Record<any, any>>(config: any, opts: PopulateOpts | Rules = {}): R => {
  const ctx = createCtx(config, opts, loadSync, populateSync)
  const _config = loadResource(ctx)
  const extras: any[] = populateExtras(_config, ctx)

  return assembleValue(_config, extras, ctx)
}

export const clone = <T = any>(v: T) => JSON.parse(JSON.stringify(v))

export const parse = (name: string, contents: string) =>
  name.endsWith('.json') ? JSON.parse(contents) : contents

export const createCtx = (config: any, opts: PopulateOpts, loader: ExtraLoader, populate: Populate): Ctx => {
  const _opts = parseOpts(opts)
  const base = path.resolve(process.cwd(), _opts.cwd ?? '.')
  const [cwd, _config] = isString(config)
    ? [path.resolve(base, path.dirname(config)), path.basename(config)]
    : [base, config]

  return ({
    load: loader,
    clone: clone,
    parse: parse,
    resolve: resolve,
    cache: new Map(),
    ..._opts,
    merge: buildMerger(_opts.merge, _opts.rules),
    populate,
    cwd,
    config: _config,
  })
}

export const parseOpts = (opts: PopulateOpts | Rules = {}): PopulateOpts =>
  Object.values(opts).every(v => v === 'override' || v === 'merge')
    ? { rules: opts as Rules }
    : opts

const buildMerger = (merge?: ExtraMerger | Rules, rules?: Rules): ExtraMerger => typeof merge === 'function'
  ? merge
  : (...sources: any[]) => extend({
    sources,
    rules: rules || merge
  })

export const populateExtras = (config: any, ctx: Ctx): any[] => {
  const extras = [config?.extends, ctx.extends].flat(1).filter(Boolean)

  return extras.map(extra => ctx.populate(extra, {...ctx, extends: undefined}))
}

export const assembleValue = (config: any, extras: any[], ctx: Ctx ) =>
  ctx.merge(dextend(config), ...extras)
