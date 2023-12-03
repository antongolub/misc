# esbuild-c
> Empowers esbuild with config processing

## Motivation
* Align supported CLI options with the [JS API](). For example, to bring [specifying plugins via the CLI](https://github.com/evanw/esbuild/issues/884).
* Let configs be mergeable via `extends`.
* Load configs in any suitable formats.

## Status
Blueprint

## Install
```shell
npm i -D esbuild-c
```

## Usage

### CLI
```shell
esbuild-c [standard esbuild options]
esbuild-c --config esbuild.config.js
```
If `--config` is not specified, `esbuild-c` will look for it via [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig).

## Refs
* [esbuild/issues/884](https://github.com/evanw/esbuild/issues/884)
* [esbuild-config](https://github.com/bpierre/esbuild-config) [`npm`](https://www.npmjs.com/package/esbuild-config)
* [esbuild-resolve-config](https://github.com/yee94/utils/tree/main/packages/esbuild-resolve-config) [`npm`](https://www.npmjs.com/package/esbuild-resolve-config)
* [FlavioLionelRita/config-extends](https://github.com/FlavioLionelRita/config-extends)
* [cosmiconfig/issues/40](https://github.com/cosmiconfig/cosmiconfig/issues/40)
* [chrisblossom/ex-config](https://github.com/chrisblossom/ex-config)
* [prettier/issues/3146](https://github.com/prettier/prettier/issues/3146)

## License
[MIT](./LICENSE)
