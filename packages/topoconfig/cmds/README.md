# @topoconfig/cmds
> [topoconfig](https://github.com/antongolub/misc/tree/master/packages/topoconfig/core) basic cmds preset

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_topoconfig_cmds.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm (scoped)](https://img.shields.io/npm/v/@topoconfig/cmds/latest.svg?label=npm&color=white)](https://www.npmjs.com/package/@topoconfig/cmds)

## Status
Working draft

## Install
```shell
yarn add @topoconfig/cmds
```

## Usage
```ts
import {topoconfig} from 'topoconfig'
import * as cmds from '@topoconfig/cmds'

const config = await topoconfig({
  data: {},
  sources: {},
  cmds
})
```

### `get`
[lodash.get](https://www.npmjs.com/package/lodash.get)-inspired dot-prop reader.

```ts
import {topoconfig} from 'topoconfig'
import {get} from 'topoconfig/cmds'

const config = await topconfig({
  cmds: {get},
  data: '$b',
  sources: {
    a: {
      data: {
        foo: {
          bar: 'baz'
        }
      }
    },
    b: 'get $a .foo.bar' // gives 'baz'
  }
})
```

### `file`
Reads file.

```ts
import {topoconfig} from 'topoconfig'
import {file, json} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {
    file,
    json
  },
  data: {
    contents: '$contents'
  },
  sources: {
    contents: 'file file.json > json'
  }
})
```

### `json`
Parses value as JSON.

```ts
import {topoconfig} from 'topoconfig'
import {json} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {
    json
  },
  data: {
    contents: '$contents'
  },
  sources: {
    contents: 'json {"foo":"bar"}'
  }
})
```

### `yaml`
Parses value as YAML.

```ts
import {topoconfig} from 'topoconfig'
import {yaml} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {
    yaml
  },
  data: {
    contents: '$contents'
  },
  sources: {
    contents: 'yaml "foo: bar"'
  }
})
```

### `http`
Invokes [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch) to get data from remotes.

```ts
import {topoconfig} from 'topoconfig'
import {http, get, json} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {
    http,
    get,
    json
  },
  data: {
    price: '$price',
    title: '$title'
  },
  sources: {
    res: 'http https://dummyjson.com/products > get body > json',
    title: 'get $res products.0.title',
    price: 'get $res products.0.price',
  }
})

// {title: 'iPhone 9', price: 549}
```

### `conf`
Wraps the value with [conf](https://github.com/sindresorhus/conf/) API, to bring dot-prop r/w opts, validation, file sync, etc.

```ts
import {topoconfig} from 'topoconfig'
import {conf} from 'topoconfig/cmds'

const config = await topoconfig<ReturnType<typeof conf>>({
  data: '$b',
  sources: {
    a: {
      data: {
        foo: {
          bar: 'baz'
        }
      }
    },
    schema: {
      data: {
        foo: {
          properties: {
            bar: {
              type: 'string'
            }
          }
        }
      }
    },
    b: 'conf $a $schema'
  },
  cmds: {
    conf
  }
})

config.get('foo.bar')     // 'baz'
config.set('foo.bar', 1)  // Error: Config schema violation: `foo/bar` must be string
```

### `dot`
Applies [doT](https://github.com/olado/doT) to value resolution. Follow [the v2 API guides](https://github.com/olado/doT/tree/v2) for details.

```ts
import {topoconfig} from 'topoconfig'
import {dot} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {dot},
  data: '$filename',
  sources: {
    filename: 'dot {{= "$env.ENVIRONMENT_PROFILE_NAME" || "kube" }}.json',
    env: {
      data: { ENVIRONMENT_PROFILE_NAME: 'prod' }
    }
  }
})
// prod.json
```

### `cwd`
Returns `process.cwd()`

```ts
import {topoconfig} from 'topoconfig'
import {cwd} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {cwd},
  data: '$cwd',
  sources: {
    cwd: 'cwd'
  }
})
// /current/working/dir
```

### `ip`
Resolves current [ip](https://github.com/indutny/node-ip).

```ts
import {topoconfig} from 'topoconfig'
import {ip} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {ip},
  data: '$ip',
  sources: {
    ip: 'ip'
  }
})

// 10.10.0.12
```

### `ajv`
Validates values by json-schema via [ajv](https://github.com/ajv-validator/ajv). Extra [ajv-formats](https://github.com/ajv-validator/ajv-formats) included.
```ts
import {topoconfig} from 'topoconfig'
import {ajv} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {ajs},
  data: '$output',
  sources: {
    object: {foo: 'bar'},
    schema: {type: 'object', properties: {foo: {type: 'string'}}},
    output: 'ajv $object $schema'
  }
}) // returns {foo: 'bar'} if it mathes the schema
```

### `argv`
Returns [minimist](https://github.com/minimistjs/minimist)-parsed argv.

```ts
//  app.js
import {topoconfig} from 'topoconfig'
import {argv} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {argv},
  data: {
    param: '$argv.foo'
  },
  sources: {
    argv: 'argv'
  }
}) // {param: 'bar'}

// node app.js --foo=bar
```

### `env`
Refers to `process.env`.

```ts
// app.js
import {topoconfig} from 'topoconfig'
import {env} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {env},
  data: '$env.DEBUG',
  sources: {
    env: 'env'
  }
}) // 'true'
// DEBUG=true node app.js
```

### `g`
Returns a ref to global object.

```ts
import {topoconfig} from 'topoconfig'
import {g} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {g},
  data: '$global.foo',
  sources: {
    global: 'g'
  }
})
// refers to this.globalThis.foo
```

### `pkg`
Reads the closest package.json via [read-pkg-up](https://github.com/sindresorhus/read-pkg-up)

```ts
import {topoconfig} from 'topoconfig'
import {pkg} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {pkg},
  data: '$pkg.name',
  sources: {
    pkg: 'pkg'
  }
}) // 'toposource'
```

### `xtends`
Populate `extends` ref in config files via [@topoconfig/extends](https://github.com/antongolub/misc/tree/master/packages/topoconfig/extends).
```ts
import {topoconfig} from 'topoconfig'
import {file, xtends} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {
    xtends
  },
  data: {
    contents: '$contents'
  },
  sources: {
    contents: 'file.json > xtends'
  }
})
```

## License
[MIT](./LICENSE)
