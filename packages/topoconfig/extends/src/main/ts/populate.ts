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
  const _config = await config
  const _opts = normalizeOpts(opts, load, populate)
  const _extras: any[] = await Promise.all(populateExtras(_config, _opts))

  return assembleValue(_config, _extras, _opts.clone, _opts.merge)
}

export const populateSync = <R = Record<any, any>>(config: any, opts: PopulateOpts = {}): R => {
  const _config = config
  const _opts = normalizeOpts(opts, loadSync, populateSync)
  const _extras: any[] = populateExtras(_config, _opts)

  return assembleValue(_config, _extras, _opts.clone, _opts.merge)
}

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

export const normalizeOpts = (opts: PopulateOpts, loader: ExtraLoader, populate: Populate): Ctx => {
  const _opts = parseOpts(opts)
  return ({
    cwd: process.cwd(),
    load: loader,
    clone: clone,
    ..._opts,
    merge: buildMerger(_opts.merge, _opts.rules),
    populate
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