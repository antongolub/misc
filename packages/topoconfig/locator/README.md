# @topoconfig/locator
> Reads and formats shareable configuration refs

<details>
<summary>There are many ways to point a shared config.</summary>

* locally
  * file (fs, infra assets)
  * env vars
  * deps (libs, packages)
* remote
  * db / kv store
  * config service (like consul, vault)
  * repositories (standardized API like github, gitlab)
  * custom URIs
    * http(s)
    * git+ssh
</details>


[URI](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier) seems ideal for representing any kind references, but sometimes it looks too verbose, and custom formats are used instead.
This lib is aimed to handle some of these:
  * [renovate-like](https://docs.renovatebot.com/config-presets/#github) `github>abc/foo:xyz`
  * [gh-actions-like](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idstepsuses) `actions/setup-node@v4`

## Status
PoC

## Usage
```ts
import {parse, stringify, resolve} from '@topoconfig/locator'

const raw = 'github>foo/bar'
const url = resolve(raw)          // https://raw.githubusercontent.com/qiwi/.github/main/config.json

const ref = parse(raw)            // {kind: 'github'...}
const rnvtlike = stringify(ref)   // github>qiwi/.github:config.json#main
const ghlike = stringify(ref, {   // qiwi/.github:config.json@main
  format: 'github'
})
```

### parse
Identifies and parses a given reference.
```ts
import {parse} from '@topoconfig/locator'

const ref = parse('github>qiwi/.github:my-config.yaml#master')
// 
{
  kind: 'github',
  repo: {owner: 'qiwi', repo: '.github'},
  file: 'my-config.yaml',
  rev: 'master'
}
```

If some parts are missing, they are filled with the library defaults.
```ts
const ref = parse('github>qiwi/.github')
// 
{
  //...
  file: 'config.json',
  rev: 'main'
}
```
You may also pass a custom default.
```ts
const ref = parse('github>qiwi/.github', {defaults: {file: 'prettier.json'}})
// 
{
  //...
  file: 'prettier.json',
  rev: 'main'
}
```

### stringify
Formats a given reference to a string.
```ts
import {stringify} from '@topoconfig/locator'
const ref = {
  kind: 'github',
  repo: {owner: 'qiwi', repo: '.github'},
  file: 'my-config.yaml',
  rev: 'master'
}

const rnvtlike = stringify(ref)   // github>qiwi/.github:my-config.yaml#master
const ghlike = stringify(ref, {   // qiwi/.github:my-config.yaml@master
  format: 'github'
})
```

### resolve
Converts a reference to a URL if possible.
```ts
import {resolve} from '@topoconfig/locator'

const ref = 'github>foo/bar' // string | TReference
const url = resolve(ref)     // https://raw.githubusercontent.com/qiwi/.github/main/config.json
```

## Refs
* [Renovate shareable config presets](https://docs.renovatebot.com/config-presets/#github)

## License
[MIT](./LICENSE)
