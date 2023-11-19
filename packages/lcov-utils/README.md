# lcov-utils
> parse, format and merge in one place

## Status
Working draft

## Install
```shell
yarn add lcov-utils
```

## Usage
```ts
import fs from 'node:fs/promises'
import { parse, format, merge, sum, LCOV } from 'lcov-utils'

const contents = await fs.readFile('lcov.info', 'utf8')
const lcov = parse(contents)
const str = format(lcov)

str === contents // true

const lcov2 = parse(await fs.readFile('lcov2.info', 'utf8'))
const lcov3 = merge(lcov, lcov2)

await fs.writeFile('lcov-merged.info', format(lcov3))

console.log(sum(lcov3))
/**
{
  // abs values
  brf: 194,
  brh: 161,
  fnf: 68,
  fnh: 58,
  lf: 804,
  lh: 714,
  
  // percents
  branches: 82.99,
  functions: 85.29,
  lines: 88.81,
  avg: 85.7,
  max: 88.81
}
*/

// A bit of sugar
LCOV.stringify === format // true
LCOV.parse === parse // true
```

<details>
<summary><b>Monorepo snippet</b></summary>

```js
import fs from 'node:fs/promises'
import path from 'node:path'
import glob from 'fast-glob'
import minimist from 'minimist'
import { merge, parse, format, sum } from 'lcov-utils'

const {_: patterns, cwd = process.cwd(), output = 'lcov.info'} = minimist(process.argv.slice(2), {
  string: ['cwd', 'output']
})
const paths = patterns.length > 0
  ? patterns
  : await getWsCoveragePaths(cwd)

const outFile = path.resolve(cwd, output)
const files = (await glob(paths, {
  cwd,
  absolute: true,
  onlyFiles: true
}))

const lcovs = await Promise.all(
  files.map(async f => {
    const contents = await fs.readFile(f, 'utf8')
    const prefix = path.relative(cwd, path.resolve(path.dirname(f), '../..')) + '/'
    return parse(contents, {prefix})
  })
)
const lcov = merge(...lcovs)

await fs.writeFile(outFile, format(lcov), 'utf8')

async function getWsCoveragePaths(cwd) {
  const workspaces = JSON.parse(await fs.readFile(path.resolve(cwd, 'package.json'), 'utf8'))?.workspaces || []
  return workspaces.map(w => [`${w}/coverage/lcov.info`, `${w}/target/coverage/lcov.info`]).flat()
}

console.log(sum(lcov))
```

</details>

### Data structures
```ts
export type LcovEntry = {
  tn:     string               // test name
  sf:     string               // source file
  fn:     [number, string][]   // function line and name
  fnf:    number               // functions found
  fnh:    number               // functions hit
  fnda:   [number, string][]   // function exec count and name
  da:     [number, number][]   // line and exec count
  lf:     number               // lines found
  lh:     number               // lines hit
  brda:   [number, number, number, number][]  // branch data: line, block number, branch number, taken
  brf:    number               // branches found
  brh:    number               // branches hit
}

export type Lcov = Record<string, LcovEntry>
```

https://manpages.debian.org/stretch/lcov/geninfo.1.en.html#FILES


## Caveats
1. If the original input has duplicates, they will be squashed.
```ts
TN:
SF:src/test/js/test.mjs
FN:76,assert.throws.message
FN:77,assert.throws.message
FNF:2
FNH:2
FNDA:1,assert.throws.message
FNDA:1,assert.throws.message // -> FNDA:2,assert.throws.message
DA:1,1
DA:2,1
DA:3,1
```

2. Transpilers may bring their own artifacts (wrapper fragments, polyfills, etc) to lcov:
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
3. If a function is marked with `FNDA` in multiple lcov reports (unit, it, e2e), we cannot determine with certainty whether these hits should be summed (module caching), so we just use the known max.
4. The lib follows an optimistic approach: no validation built-in, it will try to parse anything until failure.

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
