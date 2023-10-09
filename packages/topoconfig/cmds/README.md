# @topoconfig/cmds
> [topoconfig](https://github.com/antongolub/misc/tree/master/packages/topoconfig/core) basic cmds preset

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
import {http, get, json} from 'topoconfig/cmds'

const config = await topconfig({
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
    file,
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
  data: {
    filename: '$filename'
  },
  sources: {
    filename: 'dot {{= "$env.ENVIRONMENT_PROFILE_NAME" || "kube" }}.json',
    env: {
      data: { ENVIRONMENT_PROFILE_NAME: 'prod' }
    }
  }
})
// prod.json
```

### `ajv`
Validates values by json-schema via [ajv](https://github.com/ajv-validator/ajv). Extra [ajv-formats](https://github.com/ajv-validator/ajv-formats) included.
```ts
import {topoconfig} from 'topoconfig'
import {ajv} from 'topoconfig/cmds'

const config = await topoconfig({
  cmds: {ajs},
  data: {
    output: '$output'
  },
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
}) // 'bar'

// node app.js --foo=bar
```

## License
[MIT](./LICENSE)
