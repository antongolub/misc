# depshot
> Gathers deps snapshot by analyzing sources

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_dep_depshot.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/depshot.svg?&color=white)](https://www.npmjs.com/package/depshot)

## Motivation
Combine [depseek](https://github.com/antongolub/misc/tree/master/packages/dep/depseek) and [fast-glob](https://github.com/mrmlnc/fast-glob) to implement efficient dep scanner. 

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
      index: 22,
      raw: './foo',
      resolved: 'build/foo/index.mjs'
    }
  ],
  //...
}
```

## License
[MIT](./LICENSE)
