import path from 'node:path'
import fss from 'node:fs'
import fs from 'node:fs/promises'
import { Plugin, BuildOptions, BuildResult } from 'esbuild'

export type TOpts = {
  include: RegExp
  exclude: RegExp
  helper: string
  cwd: string
}

export type TOutputFile = {
  path: string
  contents: string
}

export type THook = {
  pattern: RegExp
  on: 'load' | 'end'
  transform?: (contents: string, path: string) => string | Promise<string>
  rename?: (file: string) => string | Promise<string>
}

export type TPluginOpts = Partial<TOpts>

export const extractHelpersPlugin = (options: Record<string, any> = {}): Plugin => {
  return {
    name: 'extract-helpers',
    setup(build) {
      const {
        absWorkingDir = process.cwd(),
        outdir,
        cwd = outdir || absWorkingDir,
        include = /./,
        exclude = /^$/,
        helper = 'esblib.cjs'
      } = { ...build.initialOptions, ...options } as BuildOptions & TPluginOpts
      const opts: TOpts = {
        cwd,
        include,
        exclude,
        helper
      }

      build.onEnd(async (result: BuildResult) => onEnd(result, opts))
    }
  }
}

export const onEnd = async (result: BuildResult, opts: TOpts) => {
  const outputFiles =
    result.outputFiles?.map(e => ({path: e.path, contents: e.text ?? e.contents.toString()})) ||
    opts.cwd
      ? await getOutputs(opts.cwd)
      : []

  const helpers = new Map<string, string>()
  const helperRe = /^var (__\w+) = /
  const hook: THook = {
    on: 'end',
    pattern: opts.include,
    transform(c, p) {
      const lines = c.split(/\r?\n/)
      const output: string[] = []
      const helperPath = getRelativePath(opts.cwd, p, opts.helper)
      const capture = () => {
        helpers.set(ref, helper)
        helper = ''
        ref = ''
      }

      let refs = []
      let helper = ''
      let ref = ''

      for (const line of lines) {
        if (ref) {
          helper += line + '\n'
          if (line === '};') capture()
        } else {
          const match = helperRe.exec(line)
          if (match) {
            ref = match[1]
            refs.push(ref)
            helper = line + '\n'
            if (line.endsWith(';')) capture()
          } else {
            output.push(line)
          }
        }
      }

      if (refs.length === 0) return c

      refs = refs.filter(r => output.some(l => l.includes(r)))
      return formatFile(output, refs, helperPath)
    }
  }

  const files = (await Promise.all(outputFiles.map(async file => transformFile(file, [hook])))).filter(Boolean) as TOutputFile[]
  await Promise.all(files.map(async file => {
    await fs.mkdir(path.dirname(file.path), {recursive: true})
    await fs.writeFile(file.path, file.contents, 'utf-8')
  }))

  await fs.writeFile(path.join(opts.cwd, opts.helper), formatHelpers(helpers), 'utf-8')
}

export const getRelativePath = (from: string, to: string, ref: string) => {
  const link = path.relative(from, path.join(path.dirname(to), ref))
  return link.startsWith('.') ? link : './' + link
}

export const formatHelpers = (helpers: Map<string, string>) => `
${[...helpers.values()].join('\n')}
module.exports = {
${renderList([...helpers.keys()])}
};
`

export const formatFile = (lines: string[], refs: string[], helperPath: string) => `const {
${renderList(refs)}
} = require('${helperPath}');

${lines.join('\n')}
`

export const renderList = (list: string[], pad = '  ') => list.map(r => pad + r).join(',\n')

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
      contents = hook.transform ? await hook.transform(contents, file.path) : contents
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
