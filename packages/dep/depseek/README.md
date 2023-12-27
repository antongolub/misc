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
```

## License
[MIT](./LICENSE)
