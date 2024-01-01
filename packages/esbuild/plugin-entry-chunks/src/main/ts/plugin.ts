import type {OnLoadArgs, OnResolveArgs, OnLoadResult, Plugin, OnResolveResult} from 'esbuild'
import path from 'node:path'
import fs from 'node:fs'

export const entryChunksPlugin = (options: Record<string, any> = {}): Plugin => {
  return {
    name: 'entry-chunks',
    setup(build) {
      build.onResolve({ filter: /.*/ }, onResolve)
      build.onLoad({ filter: /.*/ }, onLoad)
    }
  }
}

export const onResolve = (ctx: OnResolveArgs): OnResolveResult | undefined => {
  if (!ctx.path.startsWith('.')) {
    return
  }
  return {
    path: path.join(ctx.resolveDir, ctx.path)
  }
}

export const onLoad = async (ctx: OnLoadArgs): Promise<OnLoadResult> => {
  const input = await fs.promises.readFile(ctx.path, 'utf8')

  return { contents: input, loader: 'ts' }
}
