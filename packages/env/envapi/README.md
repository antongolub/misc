# envapi
> An API to interact with environment files

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_env_envapi.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/envapi.svg?&color=white)](https://www.npmjs.com/package/envapi)

Since [v20.6.0](https://nodejs.org/en/blog/release/v20.6.0) Node.js has built-in support for dotenv files. [dotenv](https://www.npmjs.com/package/dotenv) does the same years before. [envfile](https://www.npmjs.com/package/envfile) even before that. So, why another one? The answer is simple: to provide a more flexible and powerful API.

## Status
Working draft

## Install
```sh
yarn add envapi
``` 

## Usage
```ts
import { parse, stringify } from 'envapi'

const str = `
A=A
FOO = """bar
baz
"""
X:x #comment`

const env = parse(str)
{
  A: 'A',
  FOO: 'bar\nbaz',
  X: 'x'
}

const nstr = stringify(env)
`A=A
FOO="bar\nbaz"
X=x`
```

# Refs
* [https://hexdocs.pm/dotenvy/dotenv-file-format](https://hexdocs.pm/dotenvy/dotenv-file-format.html)
* [dotenvx](https://github.com/dotenvx/dotenvx)

## License
[MIT](./LICENSE)
