# depseek
> Seeks for dependency references in JS/TS code

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_dep_depseek.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/depseek.svg?&color=white)](https://www.npmjs.com/package/depseek)

## Motivation
Dep extraction is a common task for many tools solved in different ways from regexps to AST parsing.
This implementation relies on streams, which should significantly reduce memory consumption.

## Status
PoC

## Key features
* Streams instead of RegExp or AST parsing
* Specifies exact code references by offset
* Handles string literal and comment boundaries
* Captures bound comments (optional)

## Usage
```shell
npm i depseek
```

## Usage
```js
import fs from 'fs'
import {depseek} from 'depseek'

const stream = fs.createReadStream('index.js')
const deps = await depseek(stream)

// returns
[
  { type: 'dep', value: 'node:fs', index: 17 },
  { type: 'dep', value: 'foo', index: 34 },
  { type: 'dep', value: 'q', index: 92 }
  // ...
]
```
### Options
By default `depseek` extracts only `require` and `import` arguments. You can also capture bound comments.
```ts
const depsAndComments = await depseek(stream, {comments: true})

[
  { type: 'dep', value: 'node:fs', index: 17 },
  { type: 'dep', value: 'foo', index: 34 },
  { type: 'comment', value: ' @1.0.0', index: 46 }
  //...
]
```
Stream buffer size set to `1000` by default. You can change the limit by passing `bufferSize`.
```ts
const deps = await depseek(stream, {bufferSize: 10000})
```

## Refs
* [browserify/module-deps](https://github.com/browserify/module-deps)
* [browserify/detective](https://github.com/browserify/detective)
* [Joris-van-der-Wel/node-module-references](https://github.com/Joris-van-der-Wel/node-module-references#readme)

## License
[MIT](./LICENSE)
