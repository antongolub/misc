# esbuild-plugin-extract-helpers
> Esbuild plugin to extract cjs helpers (like tslib)

## Status
PoC

## Problem
By default, esbuild injects helpers [into each cjs module](https://github.com/evanw/esbuild/issues/1230). It's _fine_, when you have just a few, but definitely not when there are many. This plugin extracts helpers into a separate file.

## Usage
```ts
import { build, BuildOptions } from 'esbuild'
import { extractHelpersPlugin } from 'esbuild-plugin-extract-helpers'

const plugin = extractHelpersPlugin({
  cwd: 'build',         // Optional. Defaults to BuildOptions.outdir || BuildOptions.absWorkingDir
  include: /\.cjs/,     // Optional. Defaults to /./
  helper: 'esblib.cjs'  // Optional. Default value is esblib.cjs
})
const config: BuildOptions = {
  entryPoints: ['index.ts'],
  outdir: 'target/cjs',
  plugins: [plugin],
  format: 'cjs'
}

await build(config)
```

## License
[MIT](./LICENSE)
