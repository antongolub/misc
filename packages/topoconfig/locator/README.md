# @topoconfig/locator
> Reads and formats shareable configuration refs

There are many ways to share configuration between projects:
* local
  * deps (libs, packages)
  * files (via fs, infra assets)
* remote-hosted
  * repositories (standardized API like github, gitlab)
  * custom URIs
    * http(s)
    * git+ssh

[URI](https://en.wikipedia.org/wiki/Uniform_Resource_Identifier) seem to be a perfect way to represent any kind of references, but sometimes it looks too verbose, and custom formats are used instead.
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
