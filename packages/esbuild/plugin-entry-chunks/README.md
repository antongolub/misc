# esbuild-plugin-entry-chunks
> Esbuild plugin to assemble entries as chunks

## Static
PoC

## Problem
Esbuild provides [code-splitting](https://esbuild.github.io/api/#splitting) with dynamic imports to reuse common code chunks of several entries. This plugin provides similar functionality, but:
1. Bounds parts in static form.
2. Assembles entries as chunks without extracting common parts.

This is kind of workaround for [the missing manual-chunks API](https://github.com/evanw/esbuild/issues/207).

## Usage
```ts
import { build, BuildOptions } from 'esbuild'
import { entryChunksPlugin } from 'esbuild-plugin-entry-chunks'

const plugin = entryChunksPlugin()
const config: BuildOptions = {
  entryPoints: [
    'a.ts',
    'b.ts',
    'c.ts',
  ],
  plugins: [plugin],
  external: ['node:*'],
  bundle: true,
  minify: false,
  sourcemap: false,
  format: 'esm',
  allowOverwrite: true,
}

await build(config)
```

## License
[MIT](./LICENSE)
