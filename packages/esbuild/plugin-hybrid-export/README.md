# esbuild-plugin-hybrid-export
> Esbuild plugin to simplify hybrid (aka dual) packages forging

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_esbuild_plugin_hybrid_export.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/esbuild-plugin-hybrid-export.svg?&color=white)](https://www.npmjs.com/package/esbuild-plugin-hybrid-export)

## Status
PoC

## Problem
[Hybrid package](https://2ality.com/2019/10/hybrid-npm-packages.html) is a quite specific approach when, for some reason, you may need to support both modern (esm) and legacy (cjs) architectures. Node.js brings a portion of internal magic for this:
> ⚠️ When importing CommonJS modules, the module.exports object is provided as the default export. Named exports **may be available**, provided by static analysis as a convenience for better ecosystem compatibility.
> https://nodejs.org/api/esm.html#import-statements

Unfortunately, this mechanism does not provide absolute reliability. That's why, the general approach for this case is double bundling, when size is not critical. Otherwise, a little optimization fixes it easily:

_index.cjs (generated)_
```ts
const foo = 'bar'
module.exports = {
  foo
}
```
_index.mjs_
```ts
const {foo} = require('./index.cjs')
export {foo}
```
This plugin just handles the mentioned routine.

## Usage
```ts
import { build, BuildOptions } from 'esbuild'
import { hybridExportPlugin } from 'esbuild-plugin-hybrid-export'

const plugin = hybridExportPlugin({
  to: 'target/esm',
  toExt: '.mjs'
})
const config: BuildOptions = {
  entryPoints: ['index.ts'],
  outdir: 'target/cjs',
  plugins: [plugin],
  format: 'cjs'
}

await build(config)
```

## Refs
* [facebook/Rapid/issues/492](https://github.com/facebook/Rapid/issues/492)
* [fkhadra/react-toastify/issues/1061](https://github.com/fkhadra/react-toastify/issues/1061)
* [esbuild/issues/3580](https://github.com/evanw/esbuild/issues/3580)
* [esbuild/issues/1950](https://github.com/evanw/esbuild/issues/1950)
* [esbuild/issues/1591](https://github.com/evanw/esbuild/issues/1591)
* [node/issues/40891](https://github.com/nodejs/node/issues/40891)
* [commonjs-named-exports](https://2ality.com/2022/10/commonjs-named-exports.html)
* [__esModule](https://stackoverflow.com/questions/50943704/whats-the-purpose-of-object-definepropertyexports-esmodule-value-0)

## License
[MIT](./LICENSE)
