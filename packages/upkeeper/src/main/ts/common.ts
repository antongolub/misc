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
    // '-U0',
    '--diff-algorithm=patience',
    //'--minimal',
    `$(echo ${quote(a)} | git hash-object -w --stdin)`,
    `$(echo ${quote(b)} | git hash-object -w --stdin)`,
  ], {shell: 'bash', silent: true})).stdout
  const prefix = `diff --git a/${target} b/${target}
--- a/${target}
+++ b/${target}
`

  return prefix + patch.slice(patch.indexOf('@'))
    .replaceAll('\n-$', '\n-')
    .replaceAll('\n+$', '\n+')
}

export const getScript = async (a: string, b: string, target: string): Promise<string> => {
  const patch = await getPatch(a, b, target)
  console.log('debug.patch=', patch)
  console.log('debug.patch.quoted=', quote(patch))

  return `echo ${quote(patch)} | git apply -C0 --inaccurate-eof --whitespace=fix`
}

export const applyScript = async (script: string, cwd: string) => {
  await spawn('sh', [], {shell: true, cwd, input: script})
}

export const getScriptName = (...chunks: string[]): string =>
  chunks.filter(Boolean).join('-')
    .replaceAll('/', '-')
    .replaceAll('^', '')
    .replaceAll('@', '')
    .replaceAll('~', '')
    .replaceAll('.', '-') + '.sh'
