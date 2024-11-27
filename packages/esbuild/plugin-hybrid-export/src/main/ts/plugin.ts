import path from 'node:path'
import fs from 'node:fs/promises'
import type {Plugin, BuildOptions, OnEndResult} from 'esbuild'
import { resolveEntryPointsPaths, renderList, parseContentsLayout } from 'esbuild-plugin-utils'

type TOpts = {
  cwd: string
  from: string
  fromExt: string
  to: string
  toExt: string
  entryPoints: string[]
  loader: 'import' | 'require' | 'reexport'
}

type TPluginOpts = Partial<TOpts>

export const hybridExportPlugin = (options: Record<string, any> = {}): Plugin => {
  return {
    name: 'hybrid-export',
    setup(build) {
      const {
        entryPoints: entries,
        format,
        absWorkingDir = process.cwd(),
        cwd = absWorkingDir,
        outdir = cwd,
        from = outdir,
        to = from,
        outExtension: {
          '.js': fromExt = '.js'
        } = {},
        toExt = fromExt,
        loader = 'require'
      } = { ...options, ...build.initialOptions } as BuildOptions & TPluginOpts
      const entryPoints = resolveEntryPointsPaths(entries, cwd)
      const opts: TOpts = {
        cwd,
        from: path.resolve(cwd, from),
        fromExt,
        to: path.resolve(cwd, to),
        toExt,
        entryPoints,
        loader
      }

      build.onStart(() => {
        if (format !== 'cjs') {
          throw new Error('esbuild-plugin-hybrid-export requires `format: cjs`')
        }
      })
      build.onEnd(result => onEnd(result, opts))
    }
  }
}

const onEnd = async (result: OnEndResult, opts: TOpts) => {
  await Promise.all(trimCommonPrefix(opts.entryPoints)
    .map(async e => {
      const input = path.resolve(opts.from, e.replace(/\.\w+$/, opts.fromExt))
      const output = path.resolve(opts.to, e.replace(/\.\w+$/, opts.toExt))
      const _rel = path.relative(opts.to, input)
      const rel = _rel.startsWith('.') ? _rel : './' + _rel
      const raw = (await fs.readFile(input, 'utf-8')).trim()
      const refs = await getExports(raw, input)
      const { header } = parseContentsLayout(raw)
      const contents = [header, formatRefs(rel, refs, opts.loader)].filter(Boolean).join('\n')

      await fs.mkdir(path.dirname(output), {recursive: true})
      await fs.writeFile(output, contents, 'utf-8')
    }))
}

const formatRefs = (link: string, refs: string[], loader = 'require'): string => {
  const hasDefault = refs.includes('default')
  const _refs = refs.filter(r => r !== 'default')
  const module = ({
    'require': `const __module__ = require("${link}")`,
    'import': `const __module__ = await import("${link}")`,
    'reexport': `import __module__ from "${link}"`
  })[loader]

  return `${module}
const {
${renderList([..._refs, hasDefault ? 'default: __default__' : '',].filter(Boolean))}
} = __module__
export {
${renderList(_refs)}
}
${hasDefault ? 'export default __default__' : ''}
`
}


/**
 __export(fixtures_exports, {
 bar: () => bar,
 default: () => fixtures_default,
 foo: () => foo,
 qux: () => qux
 });
*/
const getExports = async (contents: string, file: string): Promise<string[]> => {
  const { lines } = parseContentsLayout(contents)
  const refs = []
  let r = false
  for (const line of lines) {
    if (line.startsWith('__reExport(')) {
      const ref = line.match(/require\("([^"]+)"\)/)?.[1] as string
      const f = path.resolve(path.dirname(file), ref)
      const c = await fs.readFile(f, 'utf-8')

      refs.push(... (await getExports(c, f)))
      continue
    }
    if (line.startsWith('__export(')) {
      r = true
      continue
    }
    if (r) {
      const m = line.match(/^\s*([\w$]+):/)?.[1];
      if (m) {
        refs.push(m)
      } else {
        r = false
      }
    }
  }

  return [...new Set(refs)]
}

const trimCommonPrefix = (files: string[]): string[] =>
  files.length === 1
    ? [path.basename(files[0])]
    : files.map(f => f.slice([...(files[0])].findIndex((c, i) => files.some(f => f.charAt(i) !== c))))
