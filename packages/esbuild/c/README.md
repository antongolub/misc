# esbuild-c
> Empowers esbuild with config processing

## Motivation
* Align supported CLI options with the [JS API](). For example, to bring [specifying plugins via the CLI](https://github.com/evanw/esbuild/issues/884).
* Let configs be mergeable via `extends`.
* Load configs in any suitable formats.

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





## License
[MIT](./LICENSE)
