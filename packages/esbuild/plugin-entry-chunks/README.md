# esbuild-plugin-entry-chunks
> Esbuild plugin to assemble entries as chunks

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_esbuild_plugin_entry_chunks.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/esbuild-plugin-entry-chunks.svg?&color=white)](https://www.npmjs.com/package/esbuild-plugin-entry-chunks)

## Status
PoC

## Problem
Esbuild provides [code-splitting](https://esbuild.github.io/api/#splitting) with dynamic imports to reuse common code chunks of several entries. This plugin provides similar functionality, but:
1. Bounds parts in static form.
2. Assembles whole entries as chunks without extracting common parts.

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
