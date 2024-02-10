import path from 'node:path'
import process from 'node:process'

import {Ctx, ExtraLoader, ExtraMerger, Populate, PopulateOpts, Rules, Strategy} from './interface.js'
import {load, loadResource, loadSync, resolve, parse} from './load.js'
import {unsetExtends, extend} from './extend.js'
import {clone, isString, getSeed} from './util.js'

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

export const createCtx = (config: any, opts: PopulateOpts, loader: ExtraLoader, populate: Populate): Ctx => {
  const _opts = parseOpts(opts)
  const base = path.resolve(process.cwd(), _opts.cwd ?? '.')
  const [cwd, _config] = isString(config)
    ? [path.resolve(base, path.dirname(config)), path.basename(config)]
    : [base, config]
  const rules = _opts.rules || {}
  const _extendKeys = Object.keys(rules).filter(k => rules[k] === Strategy.POPULATE)
  const extendKeys = _extendKeys.length > 0 ? _extendKeys : ['extends']

  return ({
    load: loader,
    clone: clone,
    parse: parse,
    resolve: resolve,
    cache: new Map(),
    ..._opts,
    merge: buildMerger(_opts.merge, rules),
    rules,
    extendKeys,
    populate,
    cwd,
    config: _config,
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
