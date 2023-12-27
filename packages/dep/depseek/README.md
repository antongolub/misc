# depseek
> Seeks for dependency references in JS/TS code

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

## Refs
* [browserify/module-deps](https://github.com/browserify/module-deps)
* [browserify/detective](https://github.com/browserify/detective)
* [Joris-van-der-Wel/node-module-references](https://github.com/Joris-van-der-Wel/node-module-references#readme)

## License
[MIT](./LICENSE)
