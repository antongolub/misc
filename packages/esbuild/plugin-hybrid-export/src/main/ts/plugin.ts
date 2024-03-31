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
        bundle,
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
        if (!bundle) {
          throw new Error('esbuild-plugin-entry-chunks requires `bundle: true`')
        }
      })
      build.onEnd(result => onEnd(result, opts))
    }
  }
}

const onEnd = async (result: OnEndResult, opts: TOpts) => {
  return
}

const normalizeEntryPoints = (entryPoints: BuildOptions['entryPoints'], cwd: string): string[] =>
  Array.isArray(entryPoints) ? entryPoints.map<string>(e => path.resolve(cwd, e as string)): []
