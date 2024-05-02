import path from 'node:path'
import fss from 'node:fs'
import fs from 'node:fs/promises'
import { Plugin, BuildOptions, OnLoadArgs, BuildResult } from 'esbuild'

export type THook = {
  pattern: RegExp
  on: 'load' | 'end'
  transform?: (contents: string) => string | Promise<string>
  rename?: (file: string) => string | Promise<string>
}

export type TOpts = {
  cwd: string
  hooks: THook[],
  outdir?: string
}

export type TOutputFile = {
  path: string
  contents: string
}

export type TPluginOpts = Partial<TOpts>

export const transformHookPlugin = (options: Record<string, any> = {}): Plugin => {
  return {
    name: 'transform-hook',
    setup(build) {
      const {
        entryPoints: entries,
        absWorkingDir = process.cwd(),
        cwd = absWorkingDir,
        outdir,
        hooks = []
      } = { ...build.initialOptions, ...options } as BuildOptions & TPluginOpts
      const opts: TOpts = {
        cwd,
        hooks,
        outdir
      }

      build.onLoad({ filter: /.*/ }, async (args: OnLoadArgs) => onLoad(args, opts))
      build.onEnd(async (result: BuildResult) => onEnd(result, opts))
    }
  }
}

export const onEnd = async (result: BuildResult, opts: TOpts) => {
  const hooks = opts.hooks.filter(h => h.on === 'end')
  const outputFiles =
    result.outputFiles?.map(e => ({path: e.path, contents: e.text})) ||
    opts.outdir
      ? await getOutputs(opts.outdir)
      : []

  const files = (await Promise.all(outputFiles.map(async file => transformFile(file, hooks)))).filter(Boolean) as TOutputFile[]
  await Promise.all(files.map(async file => {
    await fs.mkdir(path.dirname(file.path), {recursive: true})
    await fs.writeFile(file.path, file.contents, 'utf-8')
  }))
}

export const onLoad = async (args: OnLoadArgs, opts: TOpts) => {
  const file: TOutputFile = {
    path: args.path,
    contents: await fs.readFile(args.path, 'utf-8')
  }
  const hooks = opts.hooks.filter(h => h.on === 'load')
  const modified = await transformFile(file, hooks)

  if (modified) return { contents: modified.contents }
}

export const getOutputs = async (cwd = process.cwd()): Promise<TOutputFile[]> => {
  const files = await getFiles(cwd)

  return Promise.all(files.map(async file => ({
    path: file,
    contents: await fs.readFile(file, 'utf-8')
  })))
}

export const transformFile = async (file: TOutputFile, hooks: THook[]): Promise<TOutputFile | undefined> => {
  let contents = file.contents
  let path = file.path
  for (const hook of hooks) {
    if (hook.pattern.test(file.path)) {
      contents = hook.transform ? await hook.transform(contents) : contents
      path = hook.rename ? await hook.rename(path) : path
    }
  }

  if (file.path !== path || file.contents !== contents) {
    return {contents, path}
  }
}

export const getFiles = async (dir: string, files: string[] = []) => {
  if (dir.endsWith('node_modules')) return files
  for (const file of await fs.readdir(dir)) {
    const name = `${dir}/${file}`
    if (fss.statSync(name).isDirectory()) {
      await getFiles(name, files)
    } else {
      files.push(name)
    }
  }
  return files
}
