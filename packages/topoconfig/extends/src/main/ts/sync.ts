import path from 'node:path'
import { createRequire } from 'node:module'

import type {PopulateOpts} from './interface.ts'
import {
  assembleValue,
  loadExtras,
  normalizeOpts,
} from './common.ts'

const _require = import.meta.url ? createRequire(import.meta.url) : require

const loader = (id: string, cwd: string) =>
  _require(path.resolve(cwd, id))

export const populateSync = (config: any, opts: PopulateOpts = {}): Record<any, any> => {
  const _config = config
  const _opts = normalizeOpts(opts, loader, populateSync)
  const _extras: any[] = loadExtras(_config, _opts)

  return assembleValue(_config, _extras, _opts.clone, _opts.merge)
}
