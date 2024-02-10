# @topoconfig/extends
> Populates `extends` reference in configs

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_topoconfig_extends.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm (scoped)](https://img.shields.io/npm/v/@topoconfig/extends/latest.svg?label=npm&color=white)](https://www.npmjs.com/package/@topoconfig/extends)

Many tools provide `extends` feature for their configs, but it works a little differently in each place. For example, `tsconfig` applies deep merge to `compilerOptions`, while `prettier` concatenates `overrides` array sections, etc. So we have to implement these nuances on site every time, and it's tiring and annoying a bit. Seems reasonable to optimize this routine:

```ts
const tsconfig = await populate('tsconfig.json', {
  compilerOptions: 'merge'
})
```
[Implementation notes](https://dev.to/antongolub/config-extends-directive-13p6)

## Key features
* Recursive extras population (`extends` by default).
* Multiple sources support
* Configurable merging rules
* Sync and async modes
* Easy customization
* Immutability with prototype transits

<details>
<summary>Alternatives</summary>

[yargs/helpers]() is the closest one, but the differences are still [noticeable](https://github.com/yargs/yargs/blob/main/lib/utils/apply-extends.ts):
```ts
import {applyExtends} from 'yargs/helpers'

const config = applyExtends({
  extends: './base.config.json',
  foo: 'foo',
  bar: {
    a: 'a'
  }
}, process.cwd())
```
* No mjs/esm
* No immutability
* No mupltiple sources
* No custom merge which is essential for some cases like arrays
* No custom formats support
* No async mode
* No file urls support
</details>

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

The config's extra property may hold objects, strings or string[]. The last two types will be processed via the internal `load` function. Extra key defaults to `extends` but can be remapped via merging `rules`.
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

You can specify how to process config fields obtained from different sources.
There are three strategies: `populate`, `merge` and `override`. The last one is applied by default.
```ts
{
  foo: 'merge',
  bar: 'override',
  baz: 'merge',
  'baz.qux': 'merge',
  extends: 'populate',
  preset: 'populate', // now both `preset` and `extends` fields will be populated
}
```

To switch the default behavior use asterisk `*` as a key:
```ts
{
  '*': 'merge'
}
```

## CLI
If you needed this, you definitely know why.
```bash
xtends <config.json> [<opts> [<output.json>]]

xtends tsconfig.json '{"compilerOtrions": "merge"}' > resolved.json
xtends prettier.json '{"overrides": "merge"}' resolved.json
```

## Customization
Options define merging rules, but it's also suitable to override some internals:

| Option    | Description                                                                | Default              |
|-----------|----------------------------------------------------------------------------|----------------------|
| `cwd`     | Current working directory                                                  | `process.cwd()`      |
| `resolve` | Utility to reveal resource paths                                           | [#resolve](#resolve) |
| `load`    | Resource loader                                                            | [#load](#load)       |
| `parse`   | Parser function. Customize to handle non-std types like `.yaml` or `.toml` | [#parse](#parse)     |
| `merge`   | Merge function. Smth like `Object.assign` or `deepExtend` should be ok.    | [#extend](#extend)   |
| `clone`   | Internal clone function to handle non-JSON types like functions            | [#clone](#clone)     |
| `rules`   | Merging rules                                                              | `{'*': 'override'}`  |

```ts
const opts = {
  cwd: '/foo/bar',
  clone: lodash.cloneDeep,
  rules: {
    '*': 'merge'
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
  load: async (_: string, id: string, cwd: string) => (await cosmiconfig('foo', {
    searchPlaces: [id]
  }).search(cwd))?.config
})
```

Or like this:
```ts
const {load} = cosmiconfig('foo')
const config = await populate(raw, {
  load: async (_: string, id: string, cwd: string) => (await load(path.resolve(cwd, id)))?.config
})
```

Or even like this:
```ts
import cosmiconfig from 'cosmiconfig'

const config = await populate(raw, {
  async load(_: string, f: string, cwd: string) {
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

### resolve
Utility to reveal resource paths.
```ts
import { resolve } from '@topoconfig/extends'

const local = resolve('../foo.mjs', '/some/cwd/') // '/some/foo.mjs'
const external = resolve('foo-pkg', '/some/cwd/') // 'foo-pkg'
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
Basic `clone` implementation. 
```ts
import { clone } from '@topoconfig/extends'

const copy = clone({a: 'a', b() {}}) // {a: 'a', b() {}}
```
If necessary, you can replace it with a more advanced implementation, such as [rfdc](https://www.npmjs.com/package/rfdc).

## Refs
* [humanwhocodes/config-array](https://github.com/humanwhocodes/config-array)
* [FlavioLionelRita/config-extends](https://github.com/FlavioLionelRita/config-extends)
* [cosmiconfig/issues/40](https://github.com/cosmiconfig/cosmiconfig/issues/40)
* [chrisblossom/ex-config](https://github.com/chrisblossom/ex-config)
* [prettier/issues/3146](https://github.com/prettier/prettier/issues/3146)
* [prettier/resolve-config](https://github.com/prettier/prettier/blob/main/src/config/resolve-config.js)
* [vite/issues/13950](https://github.com/vitejs/vite/issues/13950)
* [bahmutov/cypress-extends](https://github.com/bahmutov/cypress-extends)
* [eslint#how-do-overrides-work](https://eslint.org/docs/latest/use/configure/configuration-files#how-do-overrides-work)
* [yargs/helpers/applyExtends](https://yargs.js.org/docs/#api-reference-configobject-extends-keyword)

## License
[MIT](./LICENSE)
