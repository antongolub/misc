# @topoconfig/locator
> Reads and formats shareable configuration refs

## Status
Blueprint

## Usage
```ts
import {parse, stringify, resolve} from '@topoconfig/locator'

const raw = 'github>qiwi/.github'
const ref = parse(raw)
const url = resolve(ref)
// https://raw.githubusercontent.com/qiwi/.github/main/config.json
```

## Refs
* [Renovate shareable config presets](https://docs.renovatebot.com/config-presets/#github)

## License
[MIT](./LICENSE)
