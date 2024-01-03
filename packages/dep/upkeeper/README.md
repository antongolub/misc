# upkeeper
> Script generator for deps updating

[![lcov](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fgithub.com%2Fantongolub%2Fmisc%2Freleases%2Fdownload%2Flcov%2Flcov-sum.json&query=%24.scopes.packages_dep_upkeeper.max&label=lcov&color=brightgreen)](https://github.com/antongolub/misc/releases/download/lcov/lcov.info)
[![npm](https://img.shields.io/npm/v/upkeeper.svg?&color=white)](https://www.npmjs.com/package/upkeeper)

## Status
PoC

## Idea
To implement deps updating in form of git patches. As a part of Hackathon We Make QIWI 2.0 2023.

## Requirements
* `git`
* `echo`
* `sed`<sub>optional</sub> 
* `nodejs` <sub>for generation phase only</sub>

## Install
```shell
npm i upkeeper
```

## Usage
```ts
import {upkeeper} from 'upkeeper'

const config = {
  granularity:  'proposal', // Granularity level: 'proposal' | 'same' | 'resource' | 'all-in'
  keepers: [
    ['npm', {
      resources:  'package.json', // package.json,packages/*/package.json
      scopes:     ['dependencies', 'devDependencies'],
      exlude:     'react',
    }]
  ],
  dryrun:   true,       // Do not apply changes
  combine:  false,      // Join all patches into one script
  diff:     'sed',      // Diff-patch provider: git or sed
  output:   'patches',  // a directory to store patches
  pre:      '',         // a scripts to run before & after each patch
  post:     'yarn install && git add . && git commit -m "chore(deps): update deps" && git push origin HEAD:refs/heads/up-deps'
}

const {scripts, proposals} = await upkeeper(config)
```
### granularity
Choose a scripts aggregation strategy to produce appropriate patches. Default is `proposal`.

| Level      | Description                                                                              |
|------------|------------------------------------------------------------------------------------------|
| `proposal` | Produces a patch for each proposal: resource + dep name + dep version                    |
| `same`     | Generates script for each common proposal: dep name + dep version. Useful for monorepos. |
| `resource` | Joins changes for each resource entry                                                    |
| `all-in`   | A single patch for all deps in all resources                                             |

### dot
[dot](https://github.com/olado/doT/blob/v2/examples/snippet.txt) is used as a template engine for `pre` and `post` options, so you can inject proposal metadata into your scripts.
```ts
{
   pre: 'echo "updated {{=it.data.name}} to {{=it.data.version}}"'
}
// 'echo "updated @emotion/css to ^11.2.0"
```

## CLI
```shell
npx upkeeper --config=config.json --output='patches'
sh patches/upkeeper.sh
```

#### Output
```shell
#!/usr/bin/env bash
set -e

echo pre
echo $'diff --git a/packages/blank/package.json b/packages/blank/package.json\n--- a/packages/blank/package.json\n+++ b/packages/blank/package.json\n@@ -46,6 +46,6 @@\n   "homepage": "https://github.com/antongolub/misc#readme",\n   "devDependencies": {\n     "@antongolub/infra": "workspace:*",\n-    "@types/node": "^20.10.3"\n+    "@types/node": "^20.10.4"\n   }\n }\n' | git apply --whitespace=fix --inaccurate-eof
echo post

echo pre
echo $'diff --git a/packages/infra/package.json b/packages/infra/package.json\n--- a/packages/infra/package.json\n+++ b/packages/infra/package.json\n@@ -23,7 +23,7 @@\n     "@semrel-extra/topo": "^1.14.0",\n     "c8": "^8.0.1",\n     "concurrently": "^8.2.2",\n-    "esbuild": "^0.19.8",\n+    "esbuild": "^0.19.9",\n     "esbuild-node-externals": "^1.11.0",\n     "eslint": "^8.55.0",\n     "eslint-config-qiwi": "^2.1.3",\n' | git apply --whitespace=fix --inaccurate-eof
echo post
# ...
```

| Option          | Description                         | Default                           |
|-----------------|-------------------------------------|-----------------------------------|
| `--cwd`         | Working directory                   | `process.cwd()`                   |
| `--config`      | Path to config file                 |                                   |
| `--combine`     | Join all patches into one script    | `false`                           |
| `--diff`        | Diff-patch provider: `git` or `sed` | `git`                             |
| `--dryrun`      | Do not apply changes.               | `true` if `--ouput` option is set |
| `--granularity` | Granularity level                   | `proposal`                        |
| `--output`      | Output directory                    |                                   |

## Refs
#### Updaters
* [th0r/npm-upgrade](https://github.com/th0r/npm-upgrade)
* [yarn upgrage-interactive](https://github.com/search?q=repo%3Ayarnpkg%2Fberry%20upgrade-interactive&type=code)
* [Anifacted/lerna-update-wizard](https://github.com/Anifacted/lerna-update-wizard)
* [codsen/update-versions](https://github.com/codsen/codsen/tree/main/packages/update-versions)

#### Bots
* [renovatebot](https://github.com/renovatebot)
* [dependabot](https://github.com/dependabot)
* [depfu](https://depfu.com/for-open-source)

#### Patchgen
* [is-it-possible-to-git-diff-2-strings](https://stackoverflow.com/questions/45853613/is-it-possible-to-git-diff-2-strings)
* [is-it-possible-to-git-diff-a-file-against-standard-input](https://stackoverflow.com/questions/15270970/is-it-possible-to-git-diff-a-file-against-standard-input)
* [is-git-diff-related-to-diff](https://unix.stackexchange.com/questions/356652/is-git-diff-related-to-diff)
* [cant-pipe-into-diff](https://unix.stackexchange.com/questions/922/cant-pipe-into-diff)
* [string-difference-in-bash](https://stackoverflow.com/questions/454427/string-difference-in-bash/454549#454549)
* [git-add-patch-with-word-diff](https://stackoverflow.com/questions/49058817/git-add-patch-with-word-diff)
* [git-apply-error-while-searching-for-can-i-use-a-patch-to-delete-a-patch](https://stackoverflow.com/questions/75061063/git-apply-error-while-searching-for-can-i-use-a-patch-to-delete-a-patch)

## License
[MIT](./LICENSE)
