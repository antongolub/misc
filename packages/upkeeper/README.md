# upkeeper
> Tiny script to update deps

## Install
```shell
npm i upkeeper
```

## Usage
```ts
import {upkeeper} from 'upkeeper'

await upkeeper({
  cwd: process.cwd(),
  target: 'package.json',
  scope: '*',
  match: '*',
  ignore: 'react',
  commit: 'yarn install && git add . && git commit -m "chore(deps): update deps" && git push origin HEAD:refs/heads/up-deps'
})
```

## Refs
* [renovatebot](https://github.com/renovatebot)
* [dependabot](https://github.com/dependabot)
* [depfu](https://depfu.com/for-open-source)

## License
[MIT](./LICENSE)
