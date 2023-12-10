# upkeeper
> Script generator for deps updating

## Status 
Blueprint

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
import {propose, script} from 'upkeeper'

const ctx = {
  cwd: process.cwd(),
  configs: [
    {
      keeper: 'npm',
      options: {
        resources: 'package.json', // package.json,packages/*/package.json
        scopes: ['dependencies', 'devDependencies'],
        exlude: 'react',
      }
    }
  ]
}

await propose(ctx)
// console.log(ctx.proposals)

await script(ctx, {
  pre: '',
  post: 'yarn install && git add . && git commit -m "chore(deps): update deps" && git push origin HEAD:refs/heads/up-deps'
})
```

## CLI
```shell
npx upkeeper --config=config.json --output=script.sh
sh script.sh
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
