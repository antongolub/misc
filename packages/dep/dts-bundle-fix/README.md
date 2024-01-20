# dts-bundle-fix
> Fix module resolution in dts bundles

## Problem
When using `tsc --declarationOnly --outFile index.d.ts` to generate a single file dts file for a project, the module paths are broken:
* https://github.com/microsoft/TypeScript/issues/4433
* https://stackoverflow.com/questions/75608981/get-rid-of-folder-prefix-in-declare-module-typescript-type-files

Why just not [dts-bundle](https://github.com/TypeStrong/dts-bundle) or [dts-bundle-generator](https://github.com/timocov/dts-bundle-generator)?
Well, I believe the mentioned issue is just a temporary bug, and I'd like to keep `tsc` as _native_ typings generator.

## Install
```sh
yarn add dts-bundle-fix -D
```

## Usage
```sh
tsc --declarationOnly --outFile index.d.ts &&
dts-bundle-fix index.d.ts
```

## License
[MIT](./LICENSE)
