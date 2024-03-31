# esbuild-plugin-hybrid-export
> Esbuild plugin to simplify hybrid (aka dual) packages forging

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_esbuild_plugin_hybrid_export.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/esbuild-plugin-hybrid-export.svg?&color=white)](https://www.npmjs.com/package/esbuild-plugin-hybrid-export)

## Status
PoC

## Problem
[Hybrid package](https://2ality.com/2019/10/hybrid-npm-packages.html) is a quite specific approach when, for some reason, you may need to support both modern (esm) and legacy (cjs) architectures.
By default, esbuild suggests using two separate bundles, but is not always acceptable due to the resulting code duplication. A little optimization fixes it easily:

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
```

## Refs
* [facebook/Rapid/issues/492](https://github.com/facebook/Rapid/issues/492)
* [fkhadra/react-toastify/issues/1061](https://github.com/fkhadra/react-toastify/issues/1061)
* [esbuild/issues/3580](https://github.com/evanw/esbuild/issues/3580)
* [esbuild/issues/1950](https://github.com/evanw/esbuild/issues/1950)

## License
[MIT](./LICENSE)
