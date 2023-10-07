# @topoconfig/cmds
> Topoconfig basic cmds preset

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
{
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
}
```

### `http`
Invokes [Fetch API](https://developer.mozilla.org/en-US/docs/Web/API/fetch) to get data from remotes.
```ts
const config = await topoconfig({
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

## License
[MIT](./LICENSE)
