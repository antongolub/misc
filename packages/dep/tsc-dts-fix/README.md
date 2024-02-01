# tsc-dts-fix
> Applies some fixes to libdefs (d.ts) produced with tsc

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_dep_tsc_dts_fix.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/tsc-dts-fix.svg?&color=white)](https://www.npmjs.com/package/tsc-dts-fix)

## Problem
Despite the fact that TS is actively developed, there are still a number of problems with its `tsc` compiler.
In some situations, [generated bundles](https://github.com/antongolub/tsc-esm-fix) require modification to work correctly in runtime.
Other issues affect typings. This library is aimed to provide a workaroud for couple of them:
1. Extra extensions in modules declarations force dependent projects to partially inherit tsconfig rules.
<details>
<summary>Example</summary>

[coderef-1](src/test/fixtures/allow-ts-ext)

```ts
// a.ts
export * from './b.ts'
// b.ts
export const b = 'b'
// index.ts
export * from './a.ts'
```
```shell
tsc --emitDeclarationOnly --allowImportingTsExtensions
```
gives several dts:
```ts
// a.d.ts
export * from './b.ts'
// b.d.ts
export const b = 'b'
// index.d.ts
export * from './a.ts'
```

Meanwhile, [coderef-2](src/test/fixtures/legacy-ts-project)
```ts
export * from 'allow-ts-ext'
```
```shell
tsc --emitDeclarationOnly

1:15 - error TS5097: An import path can only end with a '.ts' extension when 'allowImportingTsExtensions' is enabled.
1 export * from './a.ts'
                ~~~~~~~~
Found 2 errors in 2 files.
Errors  Files
     1  ../allow-ts-ext/a.ts:1
     1  ../allow-ts-ext/index.ts:1
```
</details>

2. Merging dts may cause name conflicts between local and external modules.
* https://github.com/microsoft/TypeScript/issues/4433
* https://stackoverflow.com/questions/75608981/get-rid-of-folder-prefix-in-declare-module-typescript-type-files

<details>
<summary>Example</summary>

[coderef](./src/test/fixtures/name-clash)

```ts
// depseek.ts
export const foo = 'bar'

// index.ts
export {foo} from './depseek'
export {depseek} from 'depseek'
```
````shell
tsc --emitDeclarationOnly --declaration --outFile index.d.ts
````
gives:
```ts
declare module "index" {
  export {foo} from "depseek";
  export {depseek} from "depseek";
}
```
</details>

## Solution
While the [dts-bundle-generator](https://github.com/timocov/dts-bundle-generator) and [dts-bundle](https://github.com/TypeStrong/dts-bundle) projects are focused on deep restructuring of declarations, I would still like to keep `tsc` as libdefs producer and assist it make some minor adjustments to module paths resolution:
* fix relative paths
* remap extensions
* explicitly declare pkg entrypoints

## Status
Working draft

## Install
```sh
yarn add tsc-dts-fix -D
```

## Usage
### JS API

```ts
import {generateDts} from 'tsc-dts-fix'

const declarations = generateDts({
  input: 'index.ts',      // Compilation entrypoint: string | string[]
  compilerOptions: {},    // Standard ts.CompilerOptions,
  strategy: 'separate',   // Generator strategy:
                          //   'separate' – formats libdefs as separate files,
                          //   'bundle' – uses tsc to produce single dts file via `outFile` param,
                          //   'merge' – assembles separate dts chunks into single file.
  ext: '',                // Extension to remap, for ex '.js', '.cjs'.
                          // Default is '' which means to remove any existent. If `undefined`, no effect
  pkgName: 'pkg-name',    // Package name to prepend to module declarations.
  entryPoints: {
    '.': 'index.ts',      // Entry points map.
    '/cli': 'cli.ts'
  },
  conceal: true           // Restrict access to internal modules (technically replaces their names with randoms).
})
```

### CLI
```sh
tsc-dts-fix --strategy='merge' --pkg-name='@foo/bar'
```

## Alternatives
* [TypeStrong/dts-bundle](https://github.com/TypeStrong/dts-bundle)
* [timocov/dts-bundle-generator](https://github.com/timocov/dts-bundle-generator)
* [vytenisu/npm-dts](https://github.com/vytenisu/npm-dts)
* [guoyunhe/bundle-dts](https://github.com/guoyunhe/bundle-dts)
* [bundle-dts](https://www.npmjs.com/package/bundle-dts) `npm`
* [antongolub/tsc-esm-fix](https://github.com/antongolub/tsc-esm-fix)
* [Swatinem/rollup-plugin-dts](https://github.com/Swatinem/rollup-plugin-dts)

## License
[MIT](./LICENSE)
