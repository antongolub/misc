# envader
> occupies env vars for data storage

## Status
PoC

## Install
```sh
yarn add envader
```

## Usage
```ts
import {set, get, del, has} from 'envader'

const value = 'foobarbaz'.repeat(1000)

set(
  'foo',
  value,
  5000  // Optional. Chunk size limit defaults to 1000, just like Amazon does
)

const _value = get('foo')
```

## Refs
* [docs.aws.amazon.com/codepipeline/...EnvironmentVariables](https://docs.aws.amazon.com/codepipeline/latest/userguide/action-reference-CodeBuild.html#action-reference-CodeBuild-config)
* [stackoverflow / what-is-the-maximum-size-of-a-linux-environment-variable-value](https://stackoverflow.com/questions/1078031/what-is-the-maximum-size-of-a-linux-environment-variable-value)
* [devblogs.microsoft / What is the maximum length of an environment variable](https://devblogs.microsoft.com/oldnewthing/20100203-00/?p=15083#:~:text=The%20theoretical%20maximum%20length%20of,that%20theoretical%20maximum%20in%20practice.)

## License
[MIT](./LICENSE)
