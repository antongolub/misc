# zurk

<sup>
– cute sounds but never friendly. <br/>
– eat all kinds of materials.
</sup>


This subproject is a kind of experiment, addressed to the [google/zx/issues/589](https://github.com/google/zx/issues/589).
Just a testing ground for verifying ideas and approaches aimed at improve the [zx](https://github.com/google/zx) architecture.


## Proposals
- [x] Promises in cmd literals
```ts
const foo = $`echo foo`
const foobarbaz = (await $`echo ${foo} ${$`echo bar`} ${await $`echo baz`}`)
```

- [x] Both sync and async execution
```ts
const p1 = $`echo foo`
const p2 = $({sync: true})`echo foo`

const o1 = (await p1).toString()  // foo
const o2 = await p1.stdout        // foo
const o3 = p2.stdout              // foo
```

- [x] Configurable input
```ts
const input = '{"name": "foo"}'
const name = await $({input})`jq -r .name` // foo

const stdin = fs.createReadStream(path.join(fixtures, 'foo.json'))
const data = await $({stdin})`jq -r .data` // foo

const p = $`echo "5\\n3\\n1\\n4\\n2"`
const sorted = $({input: p})`sort`          // 1\n2\n3\n4\n5
```

## License
[MIT](./LICENSE)
