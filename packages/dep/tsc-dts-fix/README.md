# tsc-dts-fix
> Applies some fixes to dts produced by tsc

## Problem
Despite the fact that TS is actively developing, there are still a number of problems with its `tsc` compiler.
In some situations, [generated bundles](https://github.com/antongolub/tsc-esm-fix) require modification to work correctly in runtime.
Other issues affect typings. This library is aimed to provide a workaroud for couple of them:
1. Extra extensions in modules declarations force dependent projects to inherit tsconfig resolution rules.
<details>
<summary>Example</summary>

</details>

2. Merging dts may cause name conflicts between local and external modules.
* https://github.com/microsoft/TypeScript/issues/4433
* https://stackoverflow.com/questions/75608981/get-rid-of-folder-prefix-in-declare-module-typescript-type-files

<details>
<summary>Example</summary>

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
