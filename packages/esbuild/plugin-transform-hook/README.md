# esbuild-plugin-transform-hook
> Esbuild plugin to apply custom transformation hooks

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_esbuild_plugin_transform_hook.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/esbuild-plugin-transform-hook.svg?&color=white)](https://www.npmjs.com/package/esbuild-plugin-transform-hook)

## Status
PoC

## Problem
Esbuild and its plugins mostly focus on sources processing, but sometimes additional modifications is also necessary for dependencies or bundles:
* Polyfill injects: [esbuild#2840](https://github.com/evanw/esbuild/issues/2840), [esbuild#3517](https://github.com/evanw/esbuild/issues/3517), [esbuild#3099](https://github.com/evanw/esbuild/issues/3099)
* Custom patches: [esbuild#3360](https://github.com/evanw/esbuild/issues/3360)
* Dynamic banners: [esbuild#3291](https://github.com/evanw/esbuild/issues/3291)
* Importable helpers: [esbuild#1230](https://github.com/evanw/esbuild/issues/1230), [esbuild-plugin-extract-helpers](https://github.com/antongolub/misc/tree/master/packages/esbuild/plugin-extract-helpers)

These features will be provided sooner or later, but for now we need a workaround to apply custom transforms.  

## Usage
```ts
import { build, BuildOptions } from 'esbuild'
import { transformHookPlugin } from 'esbuild-plugin-transform-hook'

const plugin = transformHookPlugin({
  hooks: [
    {
      on: 'load', // or 'end'
      pattern: /\.ts$/,
      transform: (source) => {
        return source.replace(/console\.log/g, 'console.error')
      },
      rename: (path) => {
        return path.replace(/\.ts$/, '.js')
      }
    }
  ],
  // optional first-level pattern, defaults to /.$/
  pattern: /^(?!.*\.html$)/, 
})
const config: BuildOptions = {
  entryPoints: ['index.ts'],
  outdir: 'target/cjs',
  plugins: [plugin],
  format: 'cjs',
}

await build(config)
```

## License
[MIT](./LICENSE)
