import path from 'node:path'

import type {PopulateOpts} from './interface.ts'
import {
  normalizeOpts,
  loadExtras,
  assembleValue
} from './common.ts'

export const load = async (id: string, cwd: string) => {
  const abspath = path.resolve(cwd, id)

  return (id.endsWith('.json')
    ? (await import(abspath, {assert: {type: 'json'}}))
    : (await import(abspath))
  )?.default
}

export const populate = async <R = Record<any, any>>(config: any, opts: PopulateOpts = {}): Promise<R> => {
  const _config = await config
  const _opts = normalizeOpts(opts, load, populate)
  const _extras: any[] = await Promise.all(loadExtras(_config, _opts))

  return assembleValue(_config, _extras, _opts.clone, _opts.merge)
}
