import {Ctx, ExtraLoader, ExtraMerger, Populate, PopulateOpts, Rules, Strategy} from './interface.js'
import {load, loadResource, loadSync, resolve, parse, locateResource} from './load.js'
import {unsetExtends, extend} from './extend.js'
import {clone, getSeed} from './util.js'

export const populate = async <R = Record<any, any>>(config: any, opts: PopulateOpts | Rules = {}): Promise<R> => {
  const ctx = createCtx(config, opts, load, populate)
  const _config = await loadResource(ctx)
  const extras: any[] = await Promise.all(populateExtras(_config, ctx))

  return assembleValue(_config, extras, ctx)
}

export const populateSync = <R = Record<any, any>>(config: any, opts: PopulateOpts | Rules = {}): R => {
  const ctx = createCtx(config, opts, loadSync, populateSync, true)
  const _config = loadResource(ctx)
  const extras: any[] = populateExtras(_config, ctx)

  return assembleValue(_config, extras, ctx)
}

export const createCtx = (config: any, opts: PopulateOpts, loader: ExtraLoader, populate: Populate, sync = false): Ctx => {
  const _opts = parseOpts(opts)
  const _resolve = _opts.resolve || resolve
  const {cwd, id: _config} = locateResource(config, _resolve, _opts.cwd, sync)

  const rules = _opts.rules || {}
  const _extendKeys = Object.keys(rules).filter(k => rules[k] === Strategy.POPULATE)
  const extendKeys = _extendKeys.length > 0 ? _extendKeys : ['extends']

  return ({
    load: loader,
    clone: clone,
    parse: parse,
    cache: new Map(),
    ..._opts,
    resolve: _resolve,
    merge: buildMerger(_opts.merge, rules),
    rules,
    extendKeys,
    populate,
    cwd,
    config: _config,
    sync,
  })
}

export const parseOpts = (opts: PopulateOpts | Rules = {}): PopulateOpts =>
  Object.values(opts).every(v => v === Strategy.OVERRIDE || v === Strategy.MERGE || v === Strategy.POPULATE)
    ? { rules: opts as Rules }
    : opts

const buildMerger = (merge?: ExtraMerger | Rules, rules?: Rules): ExtraMerger => typeof merge === 'function'
  ? merge
  : (...sources: any[]) => extend({
    sources,
    rules
  })

export const populateExtras = (config: any, ctx: Ctx): any[] => {
  const extras = [...new Set([ctx.extendKeys.map(k => config?.[k]), ctx.extends].flat(2).filter(Boolean))]
  return extras.map(extra => ctx.populate(extra, {...ctx, extends: undefined}))
}

export const assembleValue = (config: any, extras: any[], ctx: Ctx ) =>
  unsetExtends(ctx.merge(getSeed(config), ...extras, config), ctx.extendKeys)
