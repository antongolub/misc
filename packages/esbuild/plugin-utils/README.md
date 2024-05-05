# esbuild-plugin-utils
> Helpers to build esbuild plugins

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_esbuild_plugin_utils.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/esbuild-plugin-utils.svg?&color=white)](https://www.npmjs.com/package/esbuild-plugin-utils)

## Status
PoC

## Usage
```ts
import {
  getFilesList,
  getOutputFiles,
  readFiles,
  transformFile,
  writeFile,
  writeFiles,
} from 'esbuild-plugin-utils'
```

### getFilesList
Scans directory and returns a list of files. Pass dir and optional recursive flag
```ts
const list = await getFilesList(process.cwd(), true) // string[]
```

### getOutputFiles
Shortcut to convert `OutputFile[]` (see esbuild.BuildResult) to `TFileEntry[]` if defined or to read files from `outdir`:
```ts
const entries = await getOutputFiles(buildResult.outputFiles, 'build') // TFileEntry[]
```

### readFiles
Reads files from a given directory and returns a list of `TFileEntry` objects
```ts
const entries = await readFiles(['file1', 'file2']) // TFileEntry[]
```

### writeFile
Persists a given `TFileEntry` to disc.
```ts
await writeFile({ contents: 'content', path: '/foo/bar.txt' })
```

### transformFile
Applies transformation hooks to a given `TFileEntry` object.
```ts
const entry = await transformFile(
  {
    contents: 'content',
    path: '/foo/bar.txt'
  },
  [{
    pattern: /./,
    transform: (contents) => contents.toUpperCase(),
    rename: (path) => path.replace('bar', 'baz'),
  }]
)
```

### resolveEntryPointsPaths
Resolves entry points paths to absolute paths.
```ts
const paths = resolveEntryPointsPaths(['file1', 'file2'], process.cwd()) // string[]
```

### renderList
Formats a comma-separated list line by line.
```ts
const list = renderList(['a', 'b'], '  ')
/**

  a,
  b

 */
```

## License
[MIT](./LICENSE)
