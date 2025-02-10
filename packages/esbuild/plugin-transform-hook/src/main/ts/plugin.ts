import fs from 'node:fs/promises'
import { Plugin, BuildOptions, OnLoadArgs, BuildResult } from 'esbuild'
import { writeFiles, getOutputFiles, transformFile } from 'esbuild-plugin-utils'

export type THook = {
  pattern: RegExp
  on: 'load' | 'end'
  if?: boolean
  transform?: (contents: string, path: string) => string | Promise<string>
  rename?: (file: string) => string | Promise<string>
}

export type TOpts = {
  cwd: string
  hooks: THook[],
  outdir?: string
  pattern?: RegExp
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
        hooks = [],
        pattern = /.*/
      } = { ...build.initialOptions, ...options } as BuildOptions & TPluginOpts
      const opts: TOpts = {
        cwd,
        hooks,
        outdir
      }

      build.onLoad({ filter: pattern }, async (args: OnLoadArgs) => onLoad(args, opts))
      build.onEnd(async (result: BuildResult) => onEnd(result, opts))
    }
  }
}

export const onEnd = async (result: BuildResult, opts: TOpts) => {
  const cwd = opts.outdir || opts.cwd
  const hooks = opts.hooks.filter(h => h.on === 'end' && (h.if ?? true))
  const outputFiles = await getOutputFiles(result.outputFiles, cwd)
  const transformedFiles = (await Promise.all(outputFiles.map(async file => transformFile(file, hooks, cwd)))).filter(Boolean) as TOutputFile[]

  await writeFiles(transformedFiles)
}

export const onLoad = async (args: OnLoadArgs, opts: TOpts) => {
  const file: TOutputFile = {
    path: args.path,
    contents: await fs.readFile(args.path, 'utf-8')
  }
  const hooks = opts.hooks.filter(h => h.on === 'load' && (h.if ?? true))
  const modified = await transformFile(file, hooks, opts.cwd)

  if (modified) return { contents: modified.contents }
}
