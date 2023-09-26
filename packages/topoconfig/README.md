## topoconfig
> [toposource](https://github.com/semrel-extra/toposource)-enhanced [uniconfig](https://github.com/qiwi/uniconfig) remastered

## Usage

```ts
import topoconfig from 'topoconfig'

const config = topoconfig({
  data: {
    foo: '$a',
    url: 'https://some.url',
    param: 'regular param value',
    num: 123,
    pwd: '\$to.prevent.value.processing.use.\.prefix',
    a: {
      b: 'get $b .some.nested.prop.value.of.b',
      c: 'get $external .prop.of.prop'
    }
  },
  sources: {
    a: 'file ./file.json utf8',
    b: 'json $a',
    c: 'get $b > assert type number',
    cwd: 'cwd',
    schema: 'file $cwd/schema.json:utf8 > json',
    external: 'retry 3 2000 > fetch http://foo.example.com > get .body > json > get .prop > ajv $schema',
    template: `dot {{? it.name }}
<div>Oh, I love your name, {{=it.name}}!</div>
{{?? it.age === 0}}
<div>Guess nobody named you yet!</div>
{{??}}
You are {{=it.age}} and still don't have a name?
{{?}}`,
    merged: 'extend $template $external'
  }
})
```

## API
```ts
// fetch:        http://foo.example.com > get:body > json > get:prop
// ↑ directive   ↑opts separated by :   ↑ pipes sep
```

## License
[MIT](./LICENSE)
