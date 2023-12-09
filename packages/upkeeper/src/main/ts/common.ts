import fs from 'node:fs/promises'
import path from 'node:path'
import glob from 'fast-glob'
import {TKeeperCtx} from './interface.ts'
import {asArray} from './util.js'

export const normalizeCtx = (flags: Record<string, any> = {}): TKeeperCtx => {
const {cwd, include, exclude, limit, offset, batch, ignore, match, target, manifests} = flags
  return {
    cwd:        cwd || process.cwd(),
    resources:  asArray(manifests || target).map(normalizeResource),
    configs:    [{
      keeper: 'npm',
      options: {
        include:    asArray(include || match),
        exclude:    asArray(exclude || ignore),
        limit:      (limit|0) || 0,
        offset:     (offset|0) || 0,
        batch:      (batch|0) || 0,
      }
    }],

    proposals:  []
  }
}

const normalizeResource = (name: string) => ({name, contents: null})

export const loadResources = async (ctx: TKeeperCtx, loader = (f: string) => fs.readFile(f, 'utf8')): Promise<TKeeperCtx> => {
  const {cwd, resources} = ctx
  const files= await glob(resources.map(r => r?.name), {cwd, onlyFiles: true, absolute: false})
  const _resources = await Promise.all(
    files.map(async (name) => ({name, contents: await loader(path.resolve(cwd, name))}))
  )

  return {...ctx, resources: _resources}
}

export const getResource = (ctx: TKeeperCtx, name: string) =>
  ctx.resources.find(r => r.name === name)
