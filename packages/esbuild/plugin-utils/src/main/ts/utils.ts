import np from 'node:path'
import fss from 'node:fs'
import fs from 'node:fs/promises'
import type { OutputFile, BuildOptions } from 'esbuild'

export type TTransformHook = {
  pattern: RegExp
  on: 'load' | 'end'
  transform?: (contents: string, path: string) => string | Promise<string>
  rename?: (file: string) => string | Promise<string>
}

export type TFileEntry = {
  path: string
  contents: string
}

export const writeFile = async (file: TFileEntry) => {
  await fs.mkdir(np.dirname(file.path), {recursive: true})
  await fs.writeFile(file.path, file.contents, 'utf-8')
}

export const writeFiles = async (files: TFileEntry[]) => {
  await Promise.all(files.map(writeFile))
}

export const getOutputFiles = async (files?: OutputFile[], outdir?: string) =>
  files?.map(e => ({path: e.path, contents: e.text})) ||
  outdir
    ? await readFiles(outdir)
    : []

export const readFile = async (file: string): Promise<TFileEntry> => ({
  path: file,
  contents: await fs.readFile(file, 'utf-8')
})

export const readFiles = async (cwd = process.cwd()): Promise<TFileEntry[]> => {
  const files = await getFilesList(cwd)
  return Promise.all(files.map(readFile))
}

export const transformFile = async (file: TFileEntry, hooks: TTransformHook[], cwd = process.cwd()): Promise<TFileEntry | undefined> => {
  let contents = file.contents
  let path = file.path
  for (const hook of hooks) {
    if (hook.pattern.test(file.path)) {
      contents = hook.transform ? await hook.transform(contents, file.path) : contents
      path = hook.rename ? np.resolve(cwd, await hook.rename(path)) : path
    }
  }

  if (file.path !== path || file.contents !== contents) {
    return {contents, path}
  }
}

export const getFilesList = async (dir: string, recursive = true, files: string[] = []) => {
  if (dir.endsWith('node_modules')) return files
  for (const file of await fs.readdir(dir)) {
    const name = `${dir}/${file}`
    if (fss.statSync(name).isDirectory()) {
      if (recursive) await getFilesList(name, recursive, files)
    } else {
      files.push(name)
    }
  }
  return files
}

export const resolveEntryPointsPaths = (entryPoints: BuildOptions['entryPoints'], cwd: string): string[] =>
  Array.isArray(entryPoints) ? entryPoints.map<string>(e => np.resolve(cwd, e as string)): []

export const renderList = (list: string[], pad = '  ') => list.map(r => pad + r).join(',\n')

export const parseContentsLayout = (contents: string) => {
  const lines = contents.split(/\r?\n/)
  const header: string[] = []
  const body: string[] = []

  for (const line of lines) {
    if (line.startsWith('#') || line.startsWith(`'use strict'`) || line.startsWith(`"use strict"`)) {
      header.push(line)
    } else {
      body.push(line)
    }
  }

  return {
    lines,
    header: header.join('\n'),
    body: body.join('\n')
  }
}

export const injectFile = (contents: string, ...files: string[]) => {
  const blocks = files.map(file => fss.readFileSync(file, 'utf8'))
  return injectCode(contents, ...blocks)
}

export const injectCode = (contents: string, ...blocks: string[]) => {
  const { header, body } = parseContentsLayout(contents)
  return [
    header,
    ...blocks,
    body,
  ]
    .filter(Boolean)
    .join('\n')
}
