import fs from 'node:fs/promises'
import path from 'node:path'
import glob from 'fast-glob'
import {TKeeperCtx, TResource} from './interface.ts'
import {spawn} from './util.ts'

export * from './diff.ts'

export const loadResources = async (refs: string[], cwd: string, loader = (f: string) => fs.readFile(f, 'utf8')): Promise<TResource[]> => {
  const files= await glob(refs, {cwd, onlyFiles: true, absolute: false})

  return Promise.all(
    files.map(async (name) => ({name, contents: await loader(path.resolve(cwd, name))}))
  )
}

export const getResource = (ctx: TKeeperCtx, name: string) =>
  ctx.resources.find(r => r.name === name)

export const applyScript = async (script: string, cwd: string) =>
  spawn('sh', [], {shell: true, cwd, input: script})

export const getScriptName = (...chunks: string[]): string =>
  chunks.filter(Boolean).join('-')
    .replaceAll('/', '-')
    .replaceAll('^', '')
    .replaceAll('@', '')
    .replaceAll('~', '')
    .replaceAll('.', '-') + '.sh'
