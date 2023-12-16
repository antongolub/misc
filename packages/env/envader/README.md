# envader
> occupies env vars for data storage

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_env_envader.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/envader.svg?&color=white)](https://www.npmjs.com/package/envader)

## Status
PoC

## Install
```sh
yarn add envader
```

## Usage
```ts
import { envader } from 'envader'

const value = 'foobarbaz'.repeat(1000)

envader.set(
  'foo',
  value,
  5000  // Optional. Chunk size limit defaults to 1000, just like Amazon does
)

envader.has('foo')  // true
envader.get('foo')  // 'foobarbazfoo...baz'
envader.del('foo')  // Removes 'foo' entry
envader.refs()      // Returns a list of all associated env vars: index and chunks
```

## Refs
* [docs.aws.amazon.com/codepipeline/...EnvironmentVariables](https://docs.aws.amazon.com/codepipeline/latest/userguide/action-reference-CodeBuild.html#action-reference-CodeBuild-config)
* [stackoverflow / what-is-the-maximum-size-of-a-linux-environment-variable-value](https://stackoverflow.com/questions/1078031/what-is-the-maximum-size-of-a-linux-environment-variable-value)
* [devblogs.microsoft / What is the maximum length of an environment variable](https://devblogs.microsoft.com/oldnewthing/20100203-00/?p=15083#:~:text=The%20theoretical%20maximum%20length%20of,that%20theoretical%20maximum%20in%20practice.)

## License
[MIT](./LICENSE)
