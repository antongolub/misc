## topoconfig
> [toposource](https://github.com/semrel-extra/toposource)-enhanced [uniconfig](https://github.com/qiwi/uniconfig) remastered

## Usage

```ts
import {topoconfig} from 'topoconfig'

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
    external: 'fetch http://foo.example.com > get .body > json > get .prop > ajv $schema',
    template: `dot {{? $name }}
<div>Oh, I love your name, {{=$name}}!</div>
{{?? $age === 0}}
<div>Guess nobody named you yet!</div>
{{??}}
You are {{=$age}} and still don't have a name?
{{?}} > assert $foo`,
    merged: 'extend $b $external'
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
