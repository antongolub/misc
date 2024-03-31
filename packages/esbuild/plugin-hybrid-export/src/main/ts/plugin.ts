import path from 'node:path'
import fs from 'node:fs'
import type {Plugin, BuildOptions, OnEndResult} from 'esbuild'

type TOpts = {
  cwd: string
  entryPoints: string[]
  ext: string
}

export const hybridExportPlugin = (options: Record<string, any> = {}): Plugin => {
  return {
    name: 'hybrid-export',
    setup(build) {
      const {
        absWorkingDir,
        format,
        entryPoints: entries,
        outExtension: {
          '.js': ext = '.js'} = {}
      } = build.initialOptions
      const cwd = absWorkingDir || process.cwd()
      const entryPoints = normalizeEntryPoints(entries, cwd)
      const opts: TOpts = {
        cwd,
        entryPoints,
        ext,
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
  console.log('result:', result, opts)
}

const normalizeEntryPoints = (entryPoints: BuildOptions['entryPoints'], cwd: string): string[] =>
  Array.isArray(entryPoints) ? entryPoints.map<string>(e => path.resolve(cwd, e as string)): []
