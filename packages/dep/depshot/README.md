# depshot
> Gathers deps snapshot by analyzing sources


## Motivation
Combine [depseek]() and [fast-glob](https://github.com/mrmlnc/fast-glob) to implement efficient dep scanner. 

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
