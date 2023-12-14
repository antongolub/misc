# envimist
> Applies [minimist](https://github.com/minimistjs/minimist) to process.env

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_env_envimist.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/envimist.svg?&color=white)](https://www.npmjs.com/package/envimist)

## Oh...
* [cross-env](https://www.npmjs.com/package/cross-env) — ok
* [dotenv](https://www.npmjs.com/package/dotenv) — ok
* Where's smth like arvg parser, env-utils?
* ...
* [env](https://www.npmjs.com/package/env)
* [xenv](https://www.npmjs.com/package/xenv)
* [envx](https://www.npmjs.com/package/envx)
* [envar](https://www.npmjs.com/package/envar)
* [envars](https://www.npmjs.com/package/envars)
* [enve](https://www.npmjs.com/package/enve)
* [envex](https://www.npmjs.com/package/envex)
* [env-map](https://www.npmjs.com/package/env-map)
* [env-util](https://www.npmjs.com/package/env-util)
* [env-utils](https://www.npmjs.com/package/env-utils)

## Status
Working draft

## Install
```sh
yarn add envimist
``` 

## Usage
```ts
import envimist from 'envimist'

const envs = envimist()

envs.path   // '/users/username/go/bin:/users/username/.kube:..'
envs.shell  // '/bin/zsh'
envs.user   // 'username'
// ...
```

You can provide some extra options to instruct the parser.
```ts
// Pass env records to parse. Defaults to process.env
const env = {
  FOO: 'false' 
}

// Regular minimist.Opts. Follow its docs for details
// https://github.com/minimistjs/minimist
const opts = {
  boolean: ['foo']
}
const envs = envimist(env, opts)

envs.foo // === false
```

To resolve variables as arrays, set splitting params:
```ts
const env = {
  FOO: 'bar,baz,qux',
  ABC: 'a,b,c',
  PATH: '/some/bin/path:/another/bin/dir'
}
const opts = {
  split: ['foo']
}

// You can also specify a custom separator:
const opts1 = {
  split: [['foo', ':']]
}
// Compbine diff vars with diff separators
const opts2 = {
  split: [['path', ':'], ['foo', 'abc', ',']]
}

envimist(env, opts2)
// {
//   foo: ['bar', 'baz', 'qux'],
//   abc: ['a', 'b', 'c'],
//   path: ['/some/bin/path', '/another/bin/dir'],
//   _: []
// }
```

## License
[MIT](./LICENSE)
