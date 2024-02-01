import path from 'node:path'
import { createRequire } from 'node:module'

import type {PopulateOpts} from './interface.ts'
import {
  assembleValue,
  loadExtras,
  normalizeOpts,
} from './common.ts'

const _require = import.meta.url ? createRequire(import.meta.url) : require

export const loadSync = (id: string, cwd: string) =>
  _require(path.resolve(cwd, id))

export const populateSync = <R = Record<any, any>>(config: any, opts: PopulateOpts = {}): R => {
  const _config = config
  const _opts = normalizeOpts(opts, loadSync, populateSync)
  const _extras: any[] = loadExtras(_config, _opts)

  return assembleValue(_config, _extras, _opts.clone, _opts.merge)
}
