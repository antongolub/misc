import path from 'node:path'
import fs from 'node:fs/promises'
import type {Plugin, BuildOptions, OnEndResult} from 'esbuild'

type THook = {
  pattern: string
  transform: (contents: string) => string | Promise<string>
  rename?: (file: string) => string | Promise<string>
}

type TOpts = {
  cwd: string
  hooks: THook[]
}

type TPluginOpts = Partial<TOpts>

export const transformHookPlugin = (options: Record<string, any> = {}): Plugin => {
  return {
    name: 'transform-hook',
    setup(build) {
      const {
        entryPoints: entries,
        format,
        absWorkingDir = process.cwd(),
        cwd = absWorkingDir,
        outdir = cwd,
        hooks = []
      } = { ...build.initialOptions, ...options } as BuildOptions & TPluginOpts
      const entryPoints = normalizeEntryPoints(entries, cwd)
      const opts: TOpts = {
        cwd,
        hooks
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
      const raw = await fs.readFile(input, 'utf-8')
      const refs = await getExports(raw, input)
      const shebang = raw.match(/^#!.+\n/)?.[0] || ''
      const contents = shebang + formatRefs(rel, refs, opts.loader)

      await fs.mkdir(path.dirname(output), {recursive: true})
      await fs.writeFile(output, contents, 'utf-8')
    }))
}


const normalizeEntryPoints = (entryPoints: BuildOptions['entryPoints'], cwd: string): string[] =>
  Array.isArray(entryPoints) ? entryPoints.map<string>(e => path.resolve(cwd, e as string)): []

const trimCommonPrefix = (files: string[]): string[] =>
  files.length === 1
    ? [path.basename(files[0])]
    : files.map(f => f.slice([...(files[0])].findIndex((c, i) => files.some(f => f.charAt(i) !== c))))
