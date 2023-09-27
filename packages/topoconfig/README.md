## topoconfig
> [toposource](https://github.com/semrel-extra/toposource)-enhanced [uniconfig](https://github.com/qiwi/uniconfig) remastered

## Install
```shell
yarn add topoconfig
```

## Usage
```ts
import {topoconfig} from 'topoconfig'

const config = topoconfig({
  data: {
    foo: '$a',
    url: 'https://some.url',
    param: 'regular param value',
    num: 123,
    pwd: '\$to.prevent.value.inject.use.\.prefix',
    a: {
      b: '$b.some.nested.prop.value.of.b',
      c: '$external.prop.of.prop'
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
`TConfigDeclaration` defines two sections: `data` and `sources`:
* `data` describes how to build the result value based on the bound sources: it populates `$`-prefixed refs with their values in every place.
* `sources` is a map, which declares the _algorithm_ to resolve some values through `cmd` calls composition. To fetch data from remote, to read from file, to convert, etc.
```json
{
  "data": "$res",
  "sources": {
    "res": "fetch https://example.com > get .body > json"
  }
}
```
* `cmd` is a provider that performs some specific action.
* `directive` is a template to define value transformation pipeline
```
// fetch http://foo.example.com > get body > json > get .prop
// ↑ cmd ↑opts                  ↑ pipes delimiter
```

## License
[MIT](./LICENSE)
