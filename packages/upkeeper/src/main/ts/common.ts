import fs from 'node:fs/promises'
import path from 'node:path'
import glob from 'fast-glob'
import {TKeeperCtx, TResource} from './interface.ts'
import {quote, spawn} from './util.ts'

export const loadResources = async (refs: string[], cwd: string, loader = (f: string) => fs.readFile(f, 'utf8')): Promise<TResource[]> => {
  const files= await glob(refs, {cwd, onlyFiles: true, absolute: false})

  return Promise.all(
    files.map(async (name) => ({name, contents: await loader(path.resolve(cwd, name))}))
  )
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
