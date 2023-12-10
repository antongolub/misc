import fs from 'node:fs/promises'
import path from 'node:path'
import glob from 'fast-glob'
import {TKeeperCtx} from './interface.ts'
import {asArray, quote, spawn} from './util.js'

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

export const getPatch = async (a: string, b: string, target: string): Promise<string> => {
  const patch = (await spawn('git', [
    'diff',
    `$(echo ${quote(a)} | git hash-object -w --stdin)`,
    `$(echo ${quote(b)} | git hash-object -w --stdin)`
  ], {shell: true, silent: true})).stdout
  const prefix = `diff --git a/${target} b/${target}
--- a/${target}
+++ b/${target}
`
  return prefix + patch.slice(patch.indexOf('@'))
}

export const getScript = async (a: string, b: string, target: string): Promise<string> => {
  const patch = await getPatch(a, b, target)

  return `echo ${quote(patch)} | git apply --whitespace=fix --inaccurate-eof`
}

export const applyScript = async (script: string, cwd: string) => {
  await spawn('echo', [
    `${quote(script)} | sh`
  ], {shell: true, cwd})
}
