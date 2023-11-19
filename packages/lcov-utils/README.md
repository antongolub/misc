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

```ts
export type LcovEntry = {
  tn:     boolean
  sf:     string
  fn:     [number, string][]
  fnf:    number
  fnh:    number
  fnda:   [number, string][]
  da:     [number, number][]
  lf:     number
  lh:     number
  brda:   [number, number, number, number | '-'][]
  brf:    number
  brh:    number
}

export type Lcov = Record<string, LcovEntry>
```

## Caveats
1. If the original input has dubs, they will be squashed.
```lcov
TN:
SF:src/test/js/test.mjs
FN:76,assert.throws.message
FN:77,assert.throws.message
FNF:2
FNH:2
FNDA:1,assert.throws.message
FNDA:1,assert.throws.message
DA:1,1
DA:2,1
DA:3,1
```
2. Transpilers may bring some artifacts (wrapper fragments, polyfills, etc) to lcov:
```ts
FN:1,topoconfig
FNF:8
FNH:5
FNDA:0,v
FNDA:0,O
FNDA:1,V
FNDA:1,W
FNDA:1,get
FNDA:1,B
FNDA:0,d
```
3. If some fn marked is `FNDA` in multiple lcovs, we cannot determine with certainty whether these values should be summed (module caching), so we just use the known max.

## Refs
#### Parsers
* [davglass/lcov-parse](https://github.com/davglass/lcov-parse)
* [bconnorwhite/parse-lcov](https://github.com/bconnorwhite/parse-lcov)
* [friedemannsommer/lcov-parser](https://github.com/friedemannsommer/lcov-parser)

#### Mergers
* [ljharb/istanbul-merge](https://github.com/ljharb/istanbul-merge)
* [mweibel/lcov-result-merger](https://github.com/mweibel/lcov-result-merger)
* [jacob-meacham/grunt-lcov-merge](https://github.com/jacob-meacham/grunt-lcov-merge)

#### Notes
* [lcov/geninfo](https://manpages.debian.org/stretch/lcov/geninfo.1.en.html#FILES)
* [linux-test-project/lcov/issues/113](https://github.com/linux-test-project/lcov/issues/113)
* [dart-lang/coverage/issues/453](https://github.com/dart-lang/coverage/issues/453)

## License
[MIT](./LICENSE)
