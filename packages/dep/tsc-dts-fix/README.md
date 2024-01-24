# tsc-dts-fix
> Applies some fixes to dts produced by tsc

## Problem
Despite the fact that TS is actively developing, there are still a number of problems with its `tsc` compiler.
In some situations, [generated bundles](https://github.com/antongolub/tsc-esm-fix) require modification to work correctly in runtime.
Other issues affect typings. This library is aimed to provide a workaroud for couple of them:
1. Extra extensions in modules declarations force dependent projects to inherit tsconfig resolution rules.
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

## Status
Blueprint

## Install
```sh
yarn add tsc-dts-fix -D
```

## Usage
```sh
tsc-dts-fix --output index.d.ts
```

## Alternatives
* [TypeStrong/dts-bundle](https://github.com/TypeStrong/dts-bundle)
* [timocov/dts-bundle-generator](https://github.com/timocov/dts-bundle-generator)
* [vytenisu/npm-dts](https://github.com/vytenisu/npm-dts)
* [guoyunhe/bundle-dts](https://github.com/guoyunhe/bundle-dts)
* [package/bundle-dts](https://www.npmjs.com/package/bundle-dts)
* [antongolub/tsc-esm-fix](https://github.com/antongolub/tsc-esm-fix)

## License
[MIT](./LICENSE)
