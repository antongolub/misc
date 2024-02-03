# @topoconfig/extends
> Flexible config extender

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_topoconfig_extends.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm (scoped)](https://img.shields.io/npm/v/@topoconfig/extends/latest.svg?label=npm&color=white)](https://www.npmjs.com/package/@topoconfig/extends)

## Motivation
Many tools provide `extends` feature for their configs, but it works a little differently in each place. For example, `tsconfig` applies deep merge to `compilerOptions`, while `prettier` concatenates `overrides` array sections, etc. So we have to implement these nuances on site every time, and it's tiring and annoying a bit. I think we could make this a little simpler. Just:
* Load resources from various formats
* Merge them according to the rules

```ts
const tsconfig = await populate('tsconfig.json', {
  compilerOptions: 'merge'
})
```

## Status
Working draft

## Install
```shell
npm i @topoconfig/extends
```

## Usage
### populate
```ts
import { populate } from '@topoconfig/extends'

/** Imagine ../base.config.cjs contents
module.export = {
  bar: {
    b: 'b'
  }
}
*/

const config = {
  extends: '../base.config.cjs',
  foo: 'foo',
  bar: {
    a: 'a'
  }
}

const result = await populate(config, {
  bar: 'merge'
})

// returns
{
  foo: 'foo',
  bar: {
    a: 'a',
    b: 'b'
  } // ← bar holds both fields from the base and the current config
}
```

If the `config` param is a string it will be treated as a path and loaded.
```ts
const result = await populate('tsconfig.json', {
  compilerOptions: 'merge'
})
```

The sync version is also available. But keep in mind that `.mjs` (ESM) files cannot be processed in this mode.
```ts
import { populateSync } from '@topoconfig/extends'

const result = populateSync({
  extends: '../base.config.cjs',
  foo: 'foo',
  bar: {
    a: 'a'
  }
}, {
  bar: 'merge'
})
```

The config's `extends` property may hold objects, strings or string[]. The last two types will be processed via the internal `load` function.
```ts
const config = {
  extends: [
    '../base.config.cjs',
    {
      // Of cource, nested `extends` will be processed too
      extends: ['../../other.config.mjs']
    }
  ]
}
```

You can specify how to join config fields obtained from different sources.
There are two strategies: `merge` and `override`. The last one is the default.
```ts
{
  foo: 'merge',
  bar: 'override',
  baz: 'merge',
  'baz.qux': 'merge'
}
```

To switch the default behavior use asterisk `*` as a key:
```ts
{
  '*': 'merge'
}
```

## Customization
Options define merging rules, but it's also suitable to override some internals:

| Option  | Description                                                                | Default                                                             |
|---------|----------------------------------------------------------------------------|---------------------------------------------------------------------|
| `cwd`   | Current working directory                                                  | `process.cwd()`                                                     |
| `load`  | Resource loader                                                            | `async (id, cwd) => (await import(path.resolve(cwd, id)))?.default` |
| `parse` | Parser function. Customize to handle non-std types like `.yaml` or `.toml` | `v => v`                                                            |
| `merge` | Merge function. Smth like `Object.assign` or `deepExtend` should be ok.    | built-in `extend`                                                   |
| `clone` | Internal clone function. Customize to handle non-JSON types like function  | `v => JSON.parse(JSON.stringify(v))`                                |
| `rules` | Merging rules                                                              | `{'*': 'override'}`                                                 |

```ts
const opts = {
  cwd: '/foo/bar',
  clone: lodash.cloneDeep,
  rules: {
    '*': 'merge'
  }
}
```

Shortcut: if the `merge` option is a plain object it will be treated as `rules`.
```ts
const opts = {
  cwd: '/foo/bar',
  merge: {
    foo: 'merge',
    bar: 'override'
  }
}
```

### yaml
No problem, `js-yaml` or `yaml-js` at your service:
```ts
import {load as parseYaml} from 'js-yaml'
import {populate} from '@topoconfig/extends'

const config = await populate('tsconfig.yaml', {
  parse: (id, contents) => {
    if (id.endsWith('.yaml') || id.endsWith('.yml')) 
        return parseYaml(contents)
    if (id.endsWith('.json')) 
        return JSON.parse(contents)
    throw new Error(`Unsupported format: ${id}`)
  }
})
```

### cosmiconfig
Definitely yes! You can use it to [find and load configs](https://github.com/cosmiconfig/cosmiconfig) in various ways:
```ts
const raw = {
  a: 'a',
  extends: '../config.extra.in.yaml'
}
const config = await populate(raw, {
  load: async (id: string, cwd: string) => (await cosmiconfig('foo', {
    searchPlaces: [id]
  }).search(cwd))?.config
})
```

Or like this:
```ts
const {load} = cosmiconfig('foo')
const config = await populate(raw, {
  load: async (id: string, cwd: string) => (await load(path.resolve(cwd, id)))?.config
})
```

Or even like this:
```ts
import cosmiconfig from 'cosmiconfig'

const config = await populate(raw, {
  async load(f: string, cwd: string) {
    return (await cosmiconfig('foobar').search(cwd))?.config
  }
})
```

## Internals
To simplify tweak ups some internals are exposed.

### extend
Accepts objects and merges them according to the rules.

```ts
import { extend } from '@topoconfig/extends'

const sources = [
    {a: {b: {foo: 'foo'}}},
    {a: {b: {bar: 'bar'}, c: 'c'}},
    {a: {b: {baz: 'baz'}, c: 'C'}}
]
const rules = {
  a: 'merge',
  'a.b': 'merge'
}
const result = extend({sources, rules})
// gives
{
  a: {
    b: {
      foo: 'foo',
      bar: 'bar',
      baz: 'baz'
    },
    c: 'C'
  }
}
```

`merge` strategy for arrays means concatenation.
```ts
const sources = [
  {a: [1]},
  {a: ['a'], b: 'b'},
  {a: [{foo: 'bar'}], c: 'c'},
]
const rules = {
  a: 'merge',
}
const result = extend({sources, rules})
// returns
{
  a: [1, 'a', {foo: 'bar'}],
  b: 'b',
  c: 'c'
}
```

### load
Resource loader in two flavors: sync and async. It uses `import/require` api for the standard formats (`.json`, `.js`, `.cjs`, `.mjs`), and `fs.read` for the rest.
```ts
import { load, loadSync } from '@topoconfig/extends'

const foo = await load('../foo.mjs', '/some/cwd/')
const bar = loadSync('../bar.json', '/some/bar')
```

### parse
Applies `JSON.parse` if the file extension is `.json`, otherwise returns the input.
```ts
export const parse = (name: string, contents: string) =>
  name.endsWith('.json') ? JSON.parse(contents) : contents
```

### clone
That's just a wrapper around `JSON.parse(JSON.stringify(v))`.

## Refs
* [humanwhocodes/config-array](https://github.com/humanwhocodes/config-array)
* [FlavioLionelRita/config-extends](https://github.com/FlavioLionelRita/config-extends)
* [cosmiconfig/issues/40](https://github.com/cosmiconfig/cosmiconfig/issues/40)
* [chrisblossom/ex-config](https://github.com/chrisblossom/ex-config)
* [prettier/issues/3146](https://github.com/prettier/prettier/issues/3146)

## License
[MIT](./LICENSE)
