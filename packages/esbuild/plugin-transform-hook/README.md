# esbuild-plugin-transform-hook
> Esbuild plugin to apply custom transformation hooks

## Status
PoC

## Problem
Most esbuild plugins focus on source conversion, but sometimes modification is also necessary for dependencies or bundles containing them.

## Usage
```ts
import { build, BuildOptions } from 'esbuild'
import { transformHookPlugin } from 'esbuild-plugin-transform-hook'

const plugin = transformHookPlugin({
  hooks: [
    {
      pattern: /\.ts$/,
      transform: (source) => {
        return source.replace(/console\.log/g, 'console.error')
      },
      rename: (path) => {
        return path.replace(/\.ts$/, '.js')
      }
    }
  ]
})
const config: BuildOptions = {
  entryPoints: ['index.ts'],
  outdir: 'target/cjs',
  plugins: [plugin],
  format: 'cjs'
}

await build(config)
```

## License
[MIT](./LICENSE)
