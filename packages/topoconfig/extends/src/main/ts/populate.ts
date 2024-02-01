import path from 'node:path'

import {
  Rules,
  ExtraMerger,
  Ctx,
  ExtraCloner,
  ExtraLoader,
  PopulateOpts,
  Populate,
} from './interface.js'

import {load, loadSync} from './load.js'
import {extend} from './extend.js'

export const populate = async <R = Record<any, any>>(config: any, opts: PopulateOpts = {}): Promise<R> => {
  const ctx = createCtx(opts, load, populate, await config)
  const _config = await loadConfig(ctx)
  const extras: any[] = await Promise.all(populateExtras(_config, ctx))

  return assembleValue(_config, extras, ctx.clone, ctx.merge)
}

export const populateSync = <R = Record<any, any>>(config: any, opts: PopulateOpts = {}): R => {
  const ctx = createCtx(opts, loadSync, populateSync, config)
  const _config = loadConfig(ctx)
  const extras: any[] = populateExtras(_config, ctx)

  return assembleValue(_config, extras, ctx.clone, ctx.merge)
}

const loadConfig = ({load, config, cwd}: Ctx) => typeof config === 'string'
  ? load(path.basename(config), cwd)
  : config

export const clone = <T = any>(v: T) => JSON.parse(JSON.stringify(v))

export const populateExtra = <P extends (...args: any[]) => any>({
  cwd = process.cwd(),
  id,
  merge,
  clone,
  load,
  populate
}: {
  cwd?: string
  id: any
  clone?: ExtraCloner
  load: ExtraLoader
  merge?: ExtraMerger
  populate: P
}) => {
  if (typeof id !== 'string') {
    return populate(id, {cwd, load, merge, clone})
  }

  const extra = load(id, cwd)
  const _cwd = path.dirname(path.resolve(cwd, id))

  return populate(extra, {
    cwd: _cwd,
    load,
    merge
  })
}

export const createCtx = (opts: PopulateOpts, loader: ExtraLoader, populate: Populate, config: any): Ctx => {
  const _opts = parseOpts(opts)
  const base = path.resolve(process.cwd(), _opts.cwd ?? '.')
  const cwd = typeof config === 'string'
    ? path.resolve(base, path.dirname(config))
    : base

  return ({
    load: loader,
    clone: clone,
    ..._opts,
    merge: buildMerger(_opts.merge, _opts.rules),
    populate,
    cwd,
    config,
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

export const populateExtras = (config: any, opts: Ctx): any[] => {
  const extras = [config?.extends, opts.extends].flat(1).filter(Boolean)

  return extras.map(id => populateExtra({id, ...opts}))
}

export const assembleValue = (config: any, extras: any[], clone: ExtraCloner, merge: ExtraMerger ) => {
  const sources: any[] = [
    clone({...config, extends: undefined}),
    ...extras
  ]

  return merge({}, ...sources)
}