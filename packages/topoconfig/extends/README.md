# @topoconfig/extends
> Flexible config extender

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_topoconfig_extends.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm (scoped)](https://img.shields.io/npm/v/@topoconfig/extends/latest.svg?label=npm&color=white)](https://www.npmjs.com/package/@topoconfig/extends)

## Motivation
Many tools provide `extends` feature for their configs, but they _seem_ not flexible enough. Different scenarios require corresponding approaches. For example, `tsconfig` applies deep merge to `compilerOptions`, while `prettier` concatenates `overrides` array sections, etc. So we have to implement these nuances on site every time, and it's tiring and annoying a bit. I think we could make this a little simpler.

## Status
Working draft

## Install
```shell
npm i @topoconfig/extends
```

## Usage
### populate
```ts
import { populate, extend }  from '@topoconfig/extends'

const config = {
  extends: '../base.config.cjs',
  foo: 'foo',
  bar: {
    a: 'a'
  }
}
const opts = {
  // define prop-specific merging rules, see `extend` API below
  merge: {
    bar: 'merge'
  }
}
const result = await populate(config, opts)
```

| Option | Description                                                               | Default                                                             |
|---|---------------------------------------------------------------------------|---------------------------------------------------------------------|
| `cwd` | Current working directory                                                 | `process.cwd()`                                                     |
| `load` | Resource loader                                                           | `async (id, cwd) => (await import(path.resolve(cwd, id)))?.default` |
| `merge` | Merge function. Smth like `Object.assign` or `deepExtend` should be ok.   | `extend` with default opts                                          |
| `clone` | Internal clone function. Customize to handle non-JSON types like function | `v => JSON.parse(JSON.stringify(v))`                                |

Shortcut: if `merge` is an object, but not a function type, it will be treated as `extend` rules preset.
```ts
const opts = {
  merge: {
    foo: 'merge',
    bar: 'override'
  }
}
```
The config's `extends` property may hold objects, strings or string[]. The last two types will be resolved via `load` function.
```ts
const config = {
  extends: [
    '../base.config.cjs',
    {
      // Btw, nested `extends` will be processed too
      extends: ['../../other.config.mjs']
    }
  ]
}
```

### extend
A configurable sources merger. Defines how exactly injected fields should be composed: `merge` or `override`. Default strategy is `override`.

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
You can apply `override` as default via setting `rules: {'*': 'override'}`

### Cosmiconfig?
Definitely yes! You can use it to load configs from various formats:
```ts
const raw = {
  a: 'a',
  extends: '../config.extra.as.json'
}
const config = await populate(raw, {
  load: async (id: string, cwd: string) => (await cosmiconfig('foo', {
    searchPlaces: [id]
  }).search(cwd))?.config
})
```
Or even like:
```ts
const {load} = cosmiconfig('foo')
const config = await populate(raw, {
  load: async (id: string, cwd: string) => (await load(path.resolve(cwd, id)))?.config
})
```

## Refs
* [humanwhocodes/config-array](https://github.com/humanwhocodes/config-array)
* [FlavioLionelRita/config-extends](https://github.com/FlavioLionelRita/config-extends)
* [cosmiconfig/issues/40](https://github.com/cosmiconfig/cosmiconfig/issues/40)
* [chrisblossom/ex-config](https://github.com/chrisblossom/ex-config)
* [prettier/issues/3146](https://github.com/prettier/prettier/issues/3146)

## License
[MIT](./LICENSE)
