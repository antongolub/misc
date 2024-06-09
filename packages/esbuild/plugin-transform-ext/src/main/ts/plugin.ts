import path from 'node:path'
import type { Plugin } from 'esbuild'
import { transformHookPlugin } from 'esbuild-plugin-transform-hook'
import { patchRefs } from 'depseek'

type THook = {
  pattern?: RegExp
  map?: Record<string, string>
}
export type TPluginOpts = {
  cwd?: string
  hooks?: THook[]
}

export const transformExtPlugin = (options: TPluginOpts = {}): Plugin => ({
  name: 'transform-ext',
  setup(build) {
    const hooks = (options.hooks || []).map(hook => ({
      pattern: hook.pattern || /./,
      on: 'end',
      transform: (contents: string) => transformLocalRefExt(contents, hook.map || build.initialOptions.outExtension),
    }))

    return transformHookPlugin({
      ...options,
      hooks
    }).setup(build)
  }
})

export const transformLocalRefExt = async (contents: string, map: Record<string, string> = {}) =>
  patchRefs(contents, ref => {
    if (ref.startsWith('.')) {
      const ext = path.extname(ref)
      const _ext = map[ext]
      if (_ext) {
        return ref.slice(0, -ext.length) + _ext
      }
    }

    return ref
  })

