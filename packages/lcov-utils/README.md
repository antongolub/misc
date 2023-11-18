# lcov-utils
> parse, format, merge in one place

## Status
blueprint

## Install
```shell
yarn add lcov-utils
```

## Usage
```ts
import fs from 'node:fs/promises'
import {parse, format, merge, LCOV} from 'lcov-utils'

const contents = await fs.readFile('lcov.info', 'utf8')
const lcov = parse(contents)
const str = format(lcov)

str === contents // true

const lcov2 = parse(await fs.readFile('lcov2.info', 'utf8'))
const lcov3 = merge(lcov, lcov2)

await fs.writeFile('lcov-merged.info', format(lcov3))

// A bit of sugar
LCOV.strigify === format // true
LCOV.parse === parse // true
```

## Refs
#### Parsers
* [davglass/lcov-parse](https://github.com/davglass/lcov-parse)
* [bconnorwhite/parse-lcov](https://github.com/bconnorwhite/parse-lcov)
* [friedemannsommer/lcov-parser](https://github.com/friedemannsommer/lcov-parser)

#### Mergers
* [ljharb/istanbul-merge](https://github.com/ljharb/istanbul-merge)
* [mweibel/lcov-result-merger](https://github.com/mweibel/lcov-result-merger)
* [jacob-meacham/grunt-lcov-merge](https://github.com/jacob-meacham/grunt-lcov-merge)

## License
[MIT](./LICENSE)
