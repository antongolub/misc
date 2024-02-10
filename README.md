## &lt;misc&gt;
> Experiment on maintaining a multi-project monorepository

[![CI](https://github.com/antongolub/misc/actions/workflows/ci.yaml/badge.svg?branch=master)](https://github.com/antongolub/misc/actions/workflows/ci.yaml)
[![Maintainability](https://api.codeclimate.com/v1/badges/1e70108b3273470415c7/maintainability)](https://codeclimate.com/github/antongolub/misc/maintainability)
[![Test Coverage](https://api.codeclimate.com/v1/badges/1e70108b3273470415c7/test_coverage)](https://codeclimate.com/github/antongolub/misc/test_coverage)

## Statuses

* `Blueprint/B` marks the project as an idea w/o any implementation provided. Just a contract proposal.   
* `PoC/C` — proof of concept that shows the declared behavior in action.
* `Working draft/W` — the project work is in progress. Some known corner cases are not covered, but it's already mostly usable.
* `Production ready/R` — the implementation is stable, documented, tested and ready for use.
* `Deprecated/D` — the project is no longer maintained.

## Contents
| Package | Description | Latest | Status |
|---|---|---|---|
| [@antongolub/blank](./packages/blank) | Blank TS project |  |  |
| [@antongolub/infra](./packages/infra) | Repo infra assets |  |  |
| [@topoconfig/cmds](./packages/topoconfig/cmds) | Topoconfig basic cmds preset | [![npm (scoped)](https://img.shields.io/npm/v/@topoconfig/cmds/latest.svg?label=&color=white)](https://www.npmjs.com/package/@topoconfig/cmds) | W |
| [@topoconfig/extends](./packages/topoconfig/extends) | Populates `extends` reference in configs | [![npm (scoped)](https://img.shields.io/npm/v/@topoconfig/extends/latest.svg?label=&color=white)](https://www.npmjs.com/package/@topoconfig/extends) | W |
| [depseek](./packages/dep/depseek) | Seeks for dependency references in JS/TS code | [![npm (scoped)](https://img.shields.io/npm/v/depseek/latest.svg?label=&color=white)](https://www.npmjs.com/package/depseek) | W |
| [depshot](./packages/dep/depshot) | Gathers deps snapshot by analyzing sources | [![npm (scoped)](https://img.shields.io/npm/v/depshot/latest.svg?label=&color=white)](https://www.npmjs.com/package/depshot) | B |
| [envader](./packages/env/envader) | Occupies env vars for data storage | [![npm (scoped)](https://img.shields.io/npm/v/envader/latest.svg?label=&color=white)](https://www.npmjs.com/package/envader) | C |
| [envimist](./packages/env/envimist) | Applies minimist to process.env | [![npm (scoped)](https://img.shields.io/npm/v/envimist/latest.svg?label=&color=white)](https://www.npmjs.com/package/envimist) | W |
| [esbuild-c](./packages/esbuild/c) | Empowers esbuild with config processing | [![npm (scoped)](https://img.shields.io/npm/v/esbuild-c/latest.svg?label=&color=white)](https://www.npmjs.com/package/esbuild-c) | C |
| [esbuild-plugin-entry-chunks](./packages/esbuild/plugin-entry-chunks) | Esbuild plugin to compose entryPoints as chunks | [![npm (scoped)](https://img.shields.io/npm/v/esbuild-plugin-entry-chunks/latest.svg?label=&color=white)](https://www.npmjs.com/package/esbuild-plugin-entry-chunks) | C |
| [lcov-utils](./packages/lcov-utils) | LCOV utils: parse, format, merge | [![npm (scoped)](https://img.shields.io/npm/v/lcov-utils/latest.svg?label=&color=white)](https://www.npmjs.com/package/lcov-utils) | W |
| [topoconfig](./packages/topoconfig/core) | Toposource-enhanced uniconfig | [![npm (scoped)](https://img.shields.io/npm/v/topoconfig/latest.svg?label=&color=white)](https://www.npmjs.com/package/topoconfig) | W |
| [tsc-dts-fix](./packages/dep/tsc-dts-fix) | Applies some fixes to libdefs produced with tsc | [![npm (scoped)](https://img.shields.io/npm/v/tsc-dts-fix/latest.svg?label=&color=white)](https://www.npmjs.com/package/tsc-dts-fix) | W |
| [upkeeper](./packages/dep/upkeeper) | Script generator for deps updating | [![npm (scoped)](https://img.shields.io/npm/v/upkeeper/latest.svg?label=&color=white)](https://www.npmjs.com/package/upkeeper) | C |

## License
[MIT](./LICENSE)
