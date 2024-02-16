import {TCtx, TLoad, TMerge, TPopulate, TPopulateOpts, TRules, TStrategy} from './interface.js'
import {load, loadResource, loadSync, resolve, parse, locateResource} from './load.js'
import {unsetExtends, extend} from './extend.js'
import {prepare, vmap} from './prepare.js'
import {getSeed} from './util.js'

export const populate = async <R = Record<any, any>>(config: any, opts: TPopulateOpts | TRules = {}): Promise<R> => {
  const ctx = createCtx(config, opts, load, populate)
  const _config = await loadResource(ctx)
  const extras: any[] = await Promise.all(populateExtras(_config, ctx))

  return assembleValue(_config, extras, ctx)
}

export const populateSync = <R = Record<any, any>>(config: any, opts: TPopulateOpts | TRules = {}): R => {
  const ctx = createCtx(config, opts, loadSync, populateSync, true)
  const _config = loadResource(ctx)
  const extras: any[] = populateExtras(_config, ctx)

  return assembleValue(_config, extras, ctx)
}

export const createCtx = (config: any, opts: TPopulateOpts, loader: TLoad, populate: TPopulate, sync = false): TCtx => {
  const _opts = parseOpts(opts)
  const rules = _opts.rules || {}
  const _extendKeys = Object.keys(rules).filter(k => rules[k] === TStrategy.POPULATE)
  const extendKeys = _extendKeys.length > 0 ? _extendKeys : ['extends']

  const _resolve = _opts.resolve || resolve
  const {cwd, id: _config, root} = locateResource({
    id: config,
    resolve: _resolve,
    cwd: _opts.cwd,
    root: _opts.root,
    sync
  })

  return ({
    load: loader,
    prepare,
    parse,
    vmap,
    cache: new Map(),
    resolve: _resolve,
    ..._opts,
    root,
    merge: buildMerger(_opts.merge, rules),
    rules,
    extendKeys,
    populate,
    cwd,
    config: _config,
    sync,
  })
}

export const parseOpts = (opts: TPopulateOpts | TRules = {}): TPopulateOpts =>
  Object.values(opts).every(v => v === TStrategy.OVERRIDE || v === TStrategy.MERGE || v === TStrategy.POPULATE)
    ? { rules: opts as TRules }
    : opts

const buildMerger = (merge?: TMerge | TRules, rules?: TRules): TMerge => typeof merge === 'function'
  ? merge
  : (...sources: any[]) => extend({
    sources,
    rules
  })

export const populateExtras = (config: any, ctx: TCtx): any[] => {
  const extras = [...new Set([ctx.extendKeys.map(k => config?.[k]), ctx.extends].flat(2).filter(Boolean))]
  return extras.map(extra => ctx.populate(extra, {...ctx, extends: undefined}))
}

export const assembleValue = (config: any, extras: any[], ctx: TCtx ) =>
  unsetExtends(ctx.merge(getSeed(config), ...extras, config), ctx.extendKeys)
