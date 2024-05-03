import np from 'node:path'
import fss from 'node:fs'
import fs from 'node:fs/promises'
import {Plugin, BuildOptions, OnLoadArgs, BuildResult, OutputFile} from 'esbuild'

export type THook = {
  pattern: RegExp
  on: 'load' | 'end'
  transform?: (contents: string, path: string) => string | Promise<string>
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
  const cwd = opts.outdir || opts.cwd
  const hooks = opts.hooks.filter(h => h.on === 'end')
  const outputFiles = await getOutputFiles(result.outputFiles, cwd)
  const transformedFiles = (await Promise.all(outputFiles.map(async file => transformFile(file, hooks, cwd)))).filter(Boolean) as TOutputFile[]

  await writeFiles(transformedFiles)
}

export const onLoad = async (args: OnLoadArgs, opts: TOpts) => {
  const file: TOutputFile = {
    path: args.path,
    contents: await fs.readFile(args.path, 'utf-8')
  }
  const hooks = opts.hooks.filter(h => h.on === 'load')
  const modified = await transformFile(file, hooks, opts.cwd)

  if (modified) return { contents: modified.contents }
}

export const writeFiles = async (files: TOutputFile[]) => {
  await Promise.all(files.map(async file => {
    await fs.mkdir(np.dirname(file.path), {recursive: true})
    await fs.writeFile(file.path, file.contents, 'utf-8')
  }))
}

export const getOutputFiles = async (files?: OutputFile[], cwd?: string) =>
  files?.map(e => ({path: e.path, contents: e.text})) ||
  cwd
    ? await readOutputs(cwd)
    : []

export const readOutputs = async (cwd = process.cwd()): Promise<TOutputFile[]> => {
  const files = await getFiles(cwd)

  return Promise.all(files.map(async file => ({
    path: file,
    contents: await fs.readFile(file, 'utf-8')
  })))
}

export const transformFile = async (file: TOutputFile, hooks: THook[], cwd = process.cwd()): Promise<TOutputFile | undefined> => {
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
