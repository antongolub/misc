# upkeeper
> Tiny script to update deps

## Status 
Blueprint

## Install
```shell
npm i upkeeper
```

## Usage
```ts
import {upkeeper} from 'upkeeper'

await upkeeper({
  cwd: process.cwd(),
  target: 'package.json', // package.json,packages/*/package.json
  scope: ['dependencies', 'devDependencies'],
  match: [],
  ignore: 'react',
  commit: 'yarn install && git add . && git commit -m "chore(deps): update deps" && git push origin HEAD:refs/heads/up-deps'
})
```

## CLI
```shell
npx upkeeper > update-pkg-json.sh
```

## Refs
* [renovatebot](https://github.com/renovatebot)
* [dependabot](https://github.com/dependabot)
* [depfu](https://depfu.com/for-open-source)

## License
[MIT](./LICENSE)
