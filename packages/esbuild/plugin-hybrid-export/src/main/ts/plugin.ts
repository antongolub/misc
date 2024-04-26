import path from 'node:path'
import fs from 'node:fs/promises'
import type {Plugin, BuildOptions, OnEndResult} from 'esbuild'

type TOpts = {
  cwd: string
  from: string
  fromExt: string
  to: string
  toExt: string
  entryPoints: string[]
}

type TPluginOpts = Partial<{
  cwd: string
  from: string
  fromExt: string
  to: string
  toExt: string
  entryPoints: string[]
  ext: string
}>

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
        toExt = fromExt
      } = { ...options, ...build.initialOptions } as BuildOptions & TPluginOpts
      const entryPoints = normalizeEntryPoints(entries, cwd)
      const opts: TOpts = {
        cwd,
        from: path.resolve(cwd, from),
        fromExt,
        to: path.resolve(cwd, to),
        toExt,
        entryPoints,
      }

      // console.log('to=', opts.to)

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
      const raw = await fs.readFile(input, 'utf-8')
      const refs = getExports(raw)
      const contents = formatRefs(rel, refs)

      await fs.mkdir(path.dirname(output), {recursive: true})
      await fs.writeFile(output, contents, 'utf-8')
    }))
}

const renderList = (list: string[]) => list.map(r => '  ' + r).join(',\n')

const formatRefs = (link: string, refs: string[]): string => {
  const hasDefault = refs.includes('default')
  const _refs = refs.filter(r => r !== 'default')

  return `const {
${renderList([..._refs, hasDefault ? 'default: __default__' : '',].filter(Boolean))}
} = require('${link}')
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
const getExports = (contents: string): string[] => {
  const lines = contents.split(/[\n\r/]/)
  const refs = []
  let r = false
  for (const line of lines) {
    if (line.startsWith('__export(')) {
      r = true
      continue
    }
    if (r) {
      const m = line.match(/(\w+): \(\) => (\w+)/)?.[1]
      if (m) {
        refs.push(m)
      } else {
        break
      }
    }
  }

  return refs
}

const normalizeEntryPoints = (entryPoints: BuildOptions['entryPoints'], cwd: string): string[] =>
  Array.isArray(entryPoints) ? entryPoints.map<string>(e => path.resolve(cwd, e as string)): []

const trimCommonPrefix = (files: string[]): string[] =>
  files.length === 1
    ? [path.basename(files[0])]
    : files.map(f => f.slice([...(files[0])].findIndex((c, i) => files.some(f => f.charAt(i) !== c))))
