# upkeeper
> Script generator for deps updating

## Status 
PoC

## Idea
To implement deps updating in form of git patches. As a part of Hackathon We Make QIWI 2.0 2023.

## Requirements
* `git`
* `echo`
* `cat`
* `nodejs` <sub>for generation phase only</sub>

## Install
```shell
npm i upkeeper
```

## Usage
```ts
import {upkeeper} from 'upkeeper'

const config = {
  granularity: 'proposal',
  keepers: [
    ['npm', {
      resources: 'package.json', // package.json,packages/*/package.json
      scopes: ['dependencies', 'devDependencies'],
      exlude: 'react',
    }]
  ],
  dryrun: true,       // Do not apply changes
  combine: false,     // Join all patches into one script
  output: 'patches',  // a directory to store patches
  pre: '',            // a scripts to run before & after each patch
  post: 'yarn install && git add . && git commit -m "chore(deps): update deps" && git push origin HEAD:refs/heads/up-deps'
}

const {scripts, proposals} = await upkeeper(config)
```

## CLI
```shell
npx upkeeper --config=config.json --output='patches'
sh patches/upkeeper.sh
```

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

## License
[MIT](./LICENSE)
