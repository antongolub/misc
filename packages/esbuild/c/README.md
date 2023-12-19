# esbuild-c
> Empowers [esbuild](https://esbuild.github.io/) with config processing

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_esbuild_c.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/esbuild-c.svg?&color=white)](https://www.npmjs.com/package/esbuild-c)

## Motivation
* Align supported CLI options with the [JS API](). For example, to bring [specifying plugins via the CLI](https://github.com/evanw/esbuild/issues/884).
* Let configs be mergeable via `extends`.
* Load configs in any suitable formats.

## Status
PoC

## Install
```shell
npm i -D esbuild-c esbuild
```

## Usage
### CLI
```shell
esbuild-c [standard esbuild options]
esbuild-c --config esbuild.config.js
```
If `--config` ref is not specified, `esbuild-c` will look for it via [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig).

### JS/TS
You can rebuild the CLI with your own logic:
```ts
#!/usr/bin/env node

import esbuild from 'esbuild'
import { loadConfig, parseArgv } from 'esbuild-c'

const flags = parseArgv(process.argv.slice(2))
const config = await loadConfig()

// do smth with the config

await esbuild.build(config)
```

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
