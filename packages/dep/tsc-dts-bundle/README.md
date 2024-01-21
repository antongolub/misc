# tsc-dts-bundle
> Fixes module paths in dts bundles produced by tsc

## Problem
Sometimes there are situations where generating a declaration in one file is preferable.
Unfortunately, using `tsc --emitDeclarationOnly --outFile index.d.ts` brings some issues with module paths.
* https://github.com/microsoft/TypeScript/issues/4433
* https://stackoverflow.com/questions/75608981/get-rid-of-folder-prefix-in-declare-module-typescript-type-files

Why just not [dts-bundle](https://github.com/TypeStrong/dts-bundle) or [dts-bundle-generator](https://github.com/timocov/dts-bundle-generator)?
Well, I believe the mentioned issue is just a temporary bug, and I'd like to keep `tsc` as _native_ typings generator.

## Status
Blueprint

## Install
```sh
yarn add tsc-dts-bundle -D
```

## Usage
```sh
tsc-dts-bundle --output index.d.ts
```

## Alternatives
* [TypeStrong/dts-bundle](https://github.com/TypeStrong/dts-bundle)
* [timocov/dts-bundle-generator](https://github.com/timocov/dts-bundle-generator)
* [vytenisu/npm-dts](https://github.com/vytenisu/npm-dts)
* [guoyunhe/bundle-dts](https://github.com/guoyunhe/bundle-dts)
* [package/bundle-dts](https://www.npmjs.com/package/bundle-dts)

## License
[MIT](./LICENSE)
