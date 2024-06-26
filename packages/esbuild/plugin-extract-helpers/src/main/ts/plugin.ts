import path from 'node:path'
import fs from 'node:fs/promises'
import { Plugin, BuildOptions, BuildResult } from 'esbuild'
import {
  type TTransformHook,
  type TFileEntry,
  transformFile,
  writeFiles,
  getOutputFiles,
  renderList,
  parseContentsLayout
} from 'esbuild-plugin-utils'

export type TOpts = {
  include: RegExp
  exclude: RegExp
  helper: string
  cwd: string
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
  const outputFiles = await getOutputFiles(result.outputFiles, opts.cwd)
  const helpers = new Map<string, string>()
  const helperRe = /^var (__\w+) = /
  const hook: TTransformHook = {
    on: 'end',
    pattern: opts.include,
    // eslint-disable-next-line sonarjs/cognitive-complexity
    transform(c, p) {
      const { lines, header, body }  = parseContentsLayout(c.trim())
      const headerSize = header ? header.split('\n').length : 0
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

      for (const line of lines.slice(headerSize)) {
        if (ref) {
          helper += line + '\n'
          if (line.endsWith(';') && !line.startsWith(' ')) capture()
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
      return formatFile(header, output, refs, helperPath)
    }
  }

  const transformedFiles = (await Promise.all(outputFiles.map(async file => transformFile(file, [hook], opts.cwd)))).filter(Boolean) as TFileEntry[]

  await writeFiles(transformedFiles)
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

export const formatFile = (header: string, lines: string[], refs: string[], helperPath: string) => {
  const body = lines.join('\n')
  const helpers = `const {
${renderList(refs)}
} = require('${helperPath}');
`

  return [
    header,
    helpers,
    body
  ].filter(Boolean).join('\n')
}
