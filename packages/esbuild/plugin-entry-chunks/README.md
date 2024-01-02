# esbuild-plugin-entry-chunks
> Esbuild plugin to compose entryPoints as chunks

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_esbuild_plugin_entry_chunks.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/esbuild-plugin-entry-chunks.svg?&color=white)](https://www.npmjs.com/package/esbuild-plugin-entry-chunks)

## Status
PoC

## Problem
Esbuild provides [code-splitting](https://esbuild.github.io/api/#splitting) with dynamic imports to reuse common code chunks of several entries. This plugin has similar functionality, but:
1. Bounds parts in static form.
2. Composes entryPoints bundles as chunks without extracting common parts.

This is kind of workaround for [the missing manual-chunks API](https://github.com/evanw/esbuild/issues/207).

### Practical case
For example, if a package has two entry points — `index.js` and `cli.js` — the last bundle will use `index.js` as a dependency without duplicating its contents.

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

Inputs:
```ts
// a.ts -----------------
export * from './b'
export const a = 'a'

// b.ts -----------------
export * from './c'
export const b = 'b'

// c.ts -----------------
export * from './d'
export const c = 'c'

// d.ts -----------------
export * from './e'
export const d = 'd'

// e.ts -----------------
import * as fs from 'node:fs'
export const e = 'e'
export const rf = fs.readFile
```

Outputs:
```ts
// a.js -----------------
// a.ts
export * from "./b.js";
var a = "a";
export {
  a
};

// b.js -----------------
// b.ts
export * from "./c.js";
var b = "b";
export {
  b
};

// c.js -----------------
// e.ts
import * as fs from "node:fs";
var e = "e";
var rf = fs.readFile;

// d.ts
var d = "d";

// c.ts
var c = "c";
export {
  c,
  d,
  e,
  rf
};
```

## License
[MIT](./LICENSE)
