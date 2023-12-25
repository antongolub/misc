# depshot
> Gathers deps snapshot by analyzing sources

## Motivation
Dep scanners are mostly focused on dep graphs. More granular and more code bound output requires _heavy_ AST parsing. There should be a compact and lightweight solution.

## Status
Blueprint

## Usage
```ts
import { depshot } from 'depshot'

const shot = depshot({
  entryPoints: ['build/index.js', 'build/**/*.mjs'],
  exclude: ['build/interface.js']
})

// gives smth like
{
  'build/index.js': [
    {
      line: 2,
      pos: 10,
      raw: './foo',
      resolved: 'build/foo/index.mjs'
    }
  ],
  //...
}
```

## Refs
* [browserify/module-deps](https://github.com/browserify/module-deps)
* [browserify/detective](https://github.com/browserify/detective)
* [Joris-van-der-Wel/node-module-references](https://github.com/Joris-van-der-Wel/node-module-references#readme)

## License
[MIT](./LICENSE)
