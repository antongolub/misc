import path from 'node:path'
import fs from 'node:fs'
import {depseekSync} from 'depseek'
import type {OnLoadArgs, OnResolveArgs, OnLoadResult, Plugin, OnResolveResult, BuildOptions} from 'esbuild'
import { resolveEntryPointsPaths } from 'esbuild-plugin-utils'

type TOpts = {
  cwd: string
  entryPoints: string[]
  ext: string
}

const externals: string[] = []

export const entryChunksPlugin = (options: Record<string, any> = {}): Plugin => {
  return {
    name: 'entry-chunks',
    setup(build) {
      const {
        absWorkingDir,
        bundle,
        entryPoints: entries,
        outExtension: {
          '.js': ext = '.js'} = {}
      } = build.initialOptions
      const cwd = absWorkingDir || process.cwd()
      const entryPoints = resolveEntryPointsPaths(entries, cwd)
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
      build.onResolve({ filter: /.*/ }, ctx => onResolve(ctx, opts))
      build.onLoad({ filter: /.*/ }, ctx => onLoad(ctx, opts))
    }
  }
}

export const onResolve = (ctx: OnResolveArgs, opts: TOpts): OnResolveResult | undefined | null=> {
  const { entryPoints, ext} = opts
  const p = path.join(ctx.resolveDir, ctx.path)

  if (externals.includes(p) || (p.endsWith(ext) && entryPoints.some(e => trimExt(e) === trimExt(p)))) {
    return {
      external: true
    }
  }

  return null
}

export const onLoad = async (ctx: OnLoadArgs, opts: TOpts): Promise<OnLoadResult> => {
  const input = await fs.promises.readFile(ctx.path, 'utf8')
  if (ctx.path.endsWith('.json')) {
    return { contents: input, loader: 'json' }
  }
  const base = path.dirname(ctx.path)
  const deps = depseekSync(input)
  const {entryPoints, ext} = opts
  const contents = deps.reduce((m, {value}) => {
    if (!value.startsWith('.')) {
      return m
    }
    const {dir, name} = path.parse(value)
    const p = path.resolve(base, dir, name + '.ts')

    if (!entryPoints.includes(p)) {
      return m
    }
    const _value = './' + name + ext
    externals.push(path.resolve(base, _value))

    return m.replace(value, _value)
  }, input)

  return { contents, loader: 'ts' }
}

const trimExt = (value: string) => {
  const {dir, name} = path.parse(value)
  return path.join(dir, name)
}
