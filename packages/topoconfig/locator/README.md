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

const raw = 'github>qiwi/.github'
const url = resolve(raw) // https://raw.githubusercontent.com/qiwi/.github/main/config.json

const ref = parse(raw) // {...}
const str = stringify(ref) // github>qiwi/.github
```

## Refs
* [Renovate shareable config presets](https://docs.renovatebot.com/config-presets/#github)

## License
[MIT](./LICENSE)
