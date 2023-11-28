# lcov-utils
> parse, format and merge in one place

[![docs](https://img.shields.io/badge/type-doc-violet)](https://antongolub.github.io/misc/lcov-utils/)
[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_lcov_utils.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/lcov-utils.svg?&color=white)](https://www.npmjs.com/package/lcov-utils)

## Status
Public beta

## Install
```shell
yarn add lcov-utils
```

## Usage
```ts
import fs from 'node:fs/promises'
import { parse, format, merge, sum, badge, LCOV } from 'lcov-utils'

const contents = await fs.readFile('lcov.info', 'utf8')
const lcov = parse(contents)    // transforms to JSON
const str = format(lcov)        // equals to contents

const lcov2 = parse(await fs.readFile('lcov2.info', 'utf8'))
const lcov3 = merge(lcov, lcov2)

const output = format(lcov3)    // converts back to LCOV-string
await fs.writeFile('lcov-merged.info', output)

const digest = sum(lcov3)       // {lines: 88.81, branches: 88.81, functions: 88.81, ...}
const covbadge = badge(lcov3)   // [![coverage](https://img.shields.io/badge/coverage-88.81-brightgreen)]()

// A bit of sugar
LCOV.stringify === format       // true
LCOV.parse === parse            // true
```

### parse
Converts LCOV-string input to JSON.
```ts
import { parse } from 'lcov-utils'

const cov = parse(lcov, {
  // default options:
  prefix: '', // prefix to inject to SF: entries
})

const cov1 = parse(lcov, {
  // or provide a custom function
  prefix: (sf) => sf.replace('packages/foo', 'packages/bar')
})
```

### format
Converts JSON back to LCOV-string.
```ts
import { format } from 'lcov-utils'

const lcov = format(cov)
```

### merge
Assembles several lcov reports into one.
```ts
import { merge } from 'lcov-utils'

const lcov1 = parse(await fs.readFile('lcov1.info', 'utf8'))
const lcov2 = parse(await fs.readFile('lcov2.info', 'utf8'))
const lcov3 = merge(lcov1, lcov2)
```

### collide
Joins lcov reports, but operates with entire (prefixed) scope blocks.
Makes sense when you are updating a previous monorepo report with coverage changes for certain packages.

```ts
import { collide } from 'lcov-utils'

const prev = parse(await fs.readFile('lcov.info', 'utf8'))
const prefix = 'packages/foo'
const delta = parse(await fs.readFile('packages/foo/lcov.info', 'utf8'), {prefix})
const lcov = collide(prev, [delta, prefix])
```
💡 use `merge` to assemble reports for the same scope obtained from different tasks (unit, it, e2e).
And invoke `collide` to build or update the entire monorepo coverage report.

### sum
Calculates coverage metrics.

```ts
import {sum} from 'lcov-utils'

const digest = sum(lcov)
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
```
Pass `prefix` as the second argument to calculate coverage for a specific scope.
```ts
const digestFiltered = sum(lcov, prefix)
```

### badge
Returns a string that creates a custom [shields.io](https://shields.io/) badge.  
> [![lcov](https://img.shields.io/badge/lcov-98.91-brightgreen?style=flat)]()
```ts
import { badge } from 'lcov-utils'

const covbadge = badge(lcov, {
  // default options:
  color: 'auto',     // any shield color (https://shields.io/badges). If `auto`, then gaps strategy is used
  style: 'flat',     // badge style: `flat`, `flat-square`, `plastic`, `for-the-badge`, `social`
  title: 'coverage', // badge title
  pick: 'max',       // which metric to use for color. One of `avg`, `max`, `lines`, `branches`, `functions`
  url: '',           // url to link, for example https://github.com/org/repo/blob/main/coverage/lcov.info
  gaps: [
    [95, 'brightgreen'],
    [90, 'green'],
    [80, 'yellowgreen'],
    [70, 'yellow'],
    [60, 'orange'],
    [0, 'red']
  ]
})
// [![coverage](https://img.shields.io/badge/coverage-88.11-yellowgreen?style=flat)]()
```
Or you can just render a json to use [endpoint-badge](https://shields.io/badges/endpoint-badge) API.

```ts
import {badgeJson} from 'lcov-utils'

const json = badgeJson(lcov, {
  // same options as above
})
/**
{
  "schemaVersion": 1,
  "label": "coverage",
  "message": "88.11",
  "color": "yellowgreen",
  "style": "flat",
}
*/
```

See also: [stevenhair/lcov-badge2](https://github.com/stevenhair/lcov-badge2)

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

#### Etc
* [lcov/geninfo](https://manpages.debian.org/stretch/lcov/geninfo.1.en.html#FILES)
* [gifnksm/lcov](https://github.com/gifnksm/lcov) `Rust` 
* [bazelbuild/bazel](https://github.com/bazelbuild/bazel/blob/master/tools/test/CoverageOutputGenerator/java/com/google/devtools/coverageoutputgenerator/LcovParser.java) `Java`
* [linux-test-project/lcov](https://github.com/linux-test-project/lcov) `Perl` 
* [linux-test-project/lcov/issues/113](https://github.com/linux-test-project/lcov/issues/113)
* [dart-lang/coverage/issues/453](https://github.com/dart-lang/coverage/issues/453)
* [stevenhair/lcov-badge2](https://github.com/stevenhair/lcov-badge2)

## License
[MIT](./LICENSE)
