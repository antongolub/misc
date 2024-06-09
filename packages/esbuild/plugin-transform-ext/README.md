# esbuild-plugin-transform-ext
> Esbuild plugin for changing file extensions in outputs

Esbuild provides some useful features for transforming file extensions: [out-extension](https://esbuild.github.io/api/#out-extension), [resolve-extensions](https://esbuild.github.io/api/#resolve-extensions).
But it [lacks the ability](https://github.com/evanw/esbuild/issues/2600) to transform file extensions in the middle of the build process – in the bundles themselves.

## Usage

```ts
import { build, BuildOptions } from 'esbuild'
import { transformExtPlugin } from 'esbuild-plugin-transform-ext'

const plugin = transformExtPlugin({
  cwd: 'target/mjs', // defaults to build.initialOptions.absWorkingDir || process.cwd()
  rules: [
    {
      pattern: /\.cjs$/, // if not specified, the plugin will apply to all files
      map: { // defautls to build.initialOptions.outExtension
        '': '.cjs',
        '.js': '.cjs',
      }
    },
    {
      pattern: /\.mjs$/,
      map: {
        '.js': '.mjs',
      }
    }
  ]
})

const config: BuildOptions = {
  entryPoints: ['index.ts'],
  outdir: 'target/cjs',
  plugins: [plugin],
  outExtension: { '.js': '.cjs' },
  format: 'cjs'
}

await build(config)
```

## Siblings
* [depseek](https://github.com/antongolub/misc/tree/master/packages/dep/depseek)
* [tsc-esm-fix](https://github.com/antongolub/tsc-esm-fix)
* [tsc-dts-fix](https://github.com/antongolub/misc/tree/master/packages/dep/tsc-dts-fix)

## License
[MIT](./LICENSE)
