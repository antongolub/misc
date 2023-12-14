# envimist
> Applies [minimist](https://github.com/minimistjs/minimist) to process.env

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




## License
[MIT](./LICENSE)
