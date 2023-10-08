## topoconfig
> [toposource](https://github.com/semrel-extra/toposource)-enhanced [uniconfig](https://github.com/qiwi/uniconfig) remastered

## Motivation
Configs can be complex. Let's try to make them a little more convenient.

<details>
<summary><b>Blah-blah-blah</b></summary>

## Config mess

Many years ago [configs](https://en.wikipedia.org/wiki/Configuration_file) were pretty simple. They looked more or less like [.properties-files](https://en.wikipedia.org/wiki/.properties) or [INI-files](https://en.wikipedia.org/wiki/INI_file), simple kv-maps with sections or composite keys to bring some kind of context:

```properties
# https://docs.oracle.com/cd/E23095_01/Platform.93/ATGProgGuide/html/s0204propertiesfileformat01.html

# You are reading a comment in ".properties" file.
! The exclamation mark can also be used for comments.
# Lines with "properties" contain a key and a value separated by a delimiting character.
# There are 3 delimiting characters: '=' (equal), ':' (colon) and whitespace (space, \t and \f).
website = https://en.wikipedia.org/
language : English
topic .properties files
# A word on a line will just create a key with no value.
empty
```

```ini
; last modified 1 April 2001 by John Doe
[owner]
name = John Doe
organization = Acme Widgets Inc.

[database]
; use IP address in case network name resolution is not working
server = 192.0.2.62     
port = 143
file = "payroll.dat"
```

At the same time, another part of the configuration was supplied from [the environment variables](https://en.wikipedia.org/wiki/Environment_variable) or [CLI parameters](https://en.wikipedia.org/wiki/Command-line_interface) reflecting the idea of dynamic settings.  

_Now we use [dotenv-files](https://stackoverflow.com/questions/68267862/what-is-an-env-or-dotenv-file-exactly), ironic :_
```ini
# https://hexdocs.pm/dotenvy/0.2.0/dotenv-file-format.html
S3_BUCKET=YOURS3BUCKET
SECRET_KEY=YOURSECRETKEYGOESHERE
```

Even then, the resolution logic began to penetrate into the app layer.
```js
// Just an illustration. This problem existed before JS was invented

const config = require('config')
const logLevel = process.env.DEBUG ? 'trace' : config.get('log.level') || 'info'
//...
const dbConfig = config.get('Customer.dbConfig')
db.connect(dbConfig, ...)

if (config.has('optionalFeature.detail')) {
  const detail = config.get('optionalFeature.detail')
  //...
}
```

When centralized configuration management came, the settings has been moved partially to the remote storage. Local pre-config (entrypoints, db credentials) was used to get the rest. Configuration assembly has become multi-stage.

Later, specialized systems such as [vault](https://developer.hashicorp.com/vault/docs) made new additions: now env holds an access token and defines an entrypoint by running mode to make a POST request to reveal credentials profile to mix this data to the entire config.

_Here's how [uniconfig](https://github.com/qiwi/uniconfig/blob/master/examples/vault.md) obtains secrets from the vault storage:_
```json
{
  "data": {
    "secret": "$vault:data"
  },
  "sources": {
    "vault": {
      "data": {
        "data": {
          "method": "GET",
          "url": "$url:",
          "opts": {
            "headers": {
              "X-Vault-Token": "$token:auth.client_token"
            }
          }
        },
        "sources": {
          "url": {
            "data": {
              "data": {
                "data": {
                  "name": "$pkg:name",
                  "space": "openapi",
                  "env": "$env:ENVIRONMENT_PROFILE_NAME",
                  "vaultHost": "$env:VAULT_HOST",
                  "vaultPort": "$env:VAULT_PORT"
                },
                "template": "{{=it.env==='production' ? 'https': 'http'}}://{{=it.vaultHost}}:{{=it.vaultPort}}/v1/secret/applications/{{=it.space}}/{{=it.name}}"
              },
              "sources": {
                "env": {
                  "pipeline": "env"
                },
                "pkg": {
                  "pipeline": "pkg"
                }
              }
            },
            "pipeline": "datatree>dot"
          },
          "token": {
            "data": {
              "data": {
                "method": "POST",
                "url": "$url:",
                "opts": {
                  "json": {
                    "role": "$pkg:name",
                    "jwt": "$jwt:"
                  }
                }
              },
              "sources": {
                "pkg": {
                  "pipeline": "pkg"
                },
                "jwt": {
                  "data": {
                    "data": {
                      "data": {
                        "tokenPath": "$env:TOKEN_FILE",
                        "defaultTokenPath": "/var/run/secrets/kubernetes.io/serviceaccount/token"
                      },
                      "template": "{{=it.tokenPath || it.defaultTokenPath}}"
                    },
                    "sources": {
                      "env": {
                        "pipeline": "env"
                      }
                    }
                  },
                  "pipeline": "datatree>dot>file"
                },
                "url": {
                  "data": {
                    "data": {
                      "data": {
                        "env": "$env:ENVIRONMENT_PROFILE_NAME",
                        "vaultHost": "$env:VAULT_HOST",
                        "vaultPort": "$env:VAULT_PORT"
                      },
                      "template": "{{=it.env==='production' ? 'https': 'http'}}://{{=it.vaultHost}}:{{=it.vaultPort}}/v1/auth/kubernetes/login"
                    },
                    "sources": {
                      "env": {
                        "pipeline": "env"
                      },
                      "pkg": {
                        "pipeline": "pkg"
                      }
                    }
                  },
                  "pipeline": "datatree>dot"
                }
              }
            },
            "pipeline": "datatree>http>json"
          }
        }
      },
      "pipeline": "datatree>http>json"
    }
  }
}
```

Meanwhile, formats have been evolving ([JSON5](https://json5.org/), [YAML](https://yaml.org/)), config entry points are constantly changing. These fluctuations, fortunately, were covered by tools like the [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig).
```js
[
  'package.json',
  `.${moduleName}rc`,
  `.${moduleName}rc.json`,
  `.${moduleName}rc.yaml`,
  `.${moduleName}rc.yml`,
  `.${moduleName}rc.js`,
  `.${moduleName}rc.ts`,
  `.${moduleName}rc.mjs`,
  `.${moduleName}rc.cjs`,
  `.config/${moduleName}rc`,
  `.config/${moduleName}rc.json`,
  `.config/${moduleName}rc.yaml`,
  `.config/${moduleName}rc.yml`,
  `.config/${moduleName}rc.js`,
  `.config/${moduleName}rc.ts`,
  `.config/${moduleName}rc.cjs`,
  `${moduleName}.config.js`,
  `${moduleName}.config.ts`,
  `${moduleName}.config.mjs`,
  `${moduleName}.config.cjs`,
]
```

Configs are still trying to be declarative, but they can't. Templates appeared first.
```yaml
template:
    metadata:
      annotations:
        cni.projectcalico.org/ipv4pools: '["${APP_NAME}"]'
        vault.hashicorp.com/agent-init-first: "true"
        vault.hashicorp.com/agent-inject: "true"
        vault.hashicorp.com/secrets-injection-method: "env"
        vault.hashicorp.com/secrets-type: "static"
        vault.hashicorp.com/agent-inject-secret-${APP_NAME}: secret-v2/applications/${DEPLOYMENT_NAMESPACE}/${APP_NAME}
        vault.hashicorp.com/agent-inject-template-${APP_NAME}: |
          {{ with secret "secret-v2/applications/${DEPLOYMENT_NAMESPACE}/${APP_NAME}" }}
            {{- range $secret_key, $secret_value := .Data.data }}
            export {{ $secret_key }}={{ $secret_value }}
            {{- end }}
          {{ end }}
        vault.hashicorp.com/auth-path: ${AUTH_PATH}
        vault.hashicorp.com/role: ${APP_NAME}
```

Then templates inside templates. With commands and scripts invocations inside dynamic DSL wrapped into matrices.
```yaml
      - uses: actions/cache@v3
        id: yarn-cache
        with:
          path: ${{ needs.init.outputs.yarn-cache-dir }}
          key: ${{ runner.os }}-yarn-${{ hashFiles('**/yarn.lock') }}
          restore-keys: |
            ${{ runner.os }}-yarn-

      - name: Restore artifact from cache (if exists)
        uses: actions/cache@v3
        with:
          path: artifact.tar
          key: artifact-${{ needs.init.outputs.checksum }}

      - name: Check artifact
        if: always()
        id: check-artifact
        run: echo "::set-output name=exists::$([ -e "artifact.tar" ] && echo true || echo false)"
```
As we can see, syntax complexity increases as the cost of declarativeness. It's still unclear how this problem can be mitigated. Perhaps new specialized formats will appear or more strict forms (schemas) of using existing ones will be introduced.

## Budget loss
Anyway, `::$([` is definitely not an _optimal_ solution. Сonfusing, fragile and overcomplicated for the most developers. For example, here is how Python Engineer was fighting against `kube.yaml`:
```text
fix vault in kube yaml Jul 04	XS		
fix vault in kube yaml Jul 04	XS
fix vault in kube yaml Jul 04	XS
fix vault in kube yaml Jul 04	XS
fix vault in kube yaml Jul 04	XS
fix vault in kube yaml Jul 04	XS
fix vault in kube yaml Jul 04	XS
fix vault in kube yaml Jul 04	XS
fix vault in kube yaml Jul 03	XS
fix vault in kube yaml Jul 03	XS
fix vault in kube yaml Jul 03	XS
fix vault in kube yaml Jul 03	XS
fix vault in kube yaml Jul 03	XS
fix vault in kube yaml Jul 03	XS
...
```
This is definitely not _configuring_ but more _guessing_. On a company scale, such exercises are a significant waste of resources. And this _experience_ is almost one-time only, which cannot be formalized and transmitted except by copy-paste. Every time we see the same thing, with a different number of attempts.

## What we need
The overcomplexity problem seems to have arisen from the fact that we combined resolving, processing and accessing data into one structure. Although the entire theory of programming / CS instructs us to do exactly the opposite. [Separation of concerns](https://en.wikipedia.org/wiki/Separation_of_concerns): imagine a config which explicitly divides value resolutions, compositions and operations.  
```json
{
  "data": "<how to expose values>",
  "sources": "<how to resolve values>",
  "cmds": "<available cmds/ops/fns>"
}
```
* Let `data` to represent how the result structure may be built if all the required transformations were made — like a _mapping_.
```json
{
  "data": {
    "a": {
      "b": "$b.some.nested.prop.value.of.b",
      "c": "$external.prop.of.prop"
    }
  }
}
```
Templating bases on regular substring replacements:
```java
String.format("foo %s", "bar")                   // gives 'foobar'
// But positional contract is enhanced with named refmap
String.format("foo $a $b $a", {"a": "A", "b": "B"}) // returns 'foo A B A'
//            ↑ data chunks ↑ sources map
```

* Let `sources` to describe how to obtain and process values for referencing in `data` map. Like _reducing_ pipelines.
```json
{
  "sources": {
    "a": "<pipeline 1>",
    "b": "<pipeline 2>"
  }
}
```
* Let `pipeline` to compose actions in natural ~~human~~ dev-readable format like CLI:
```bash
cmd param > cmd2 param param > ... > cmd3
```
* Let intermediate values be referenced by lateral (bubbling concept) or nested contexts.
```json5
{
  "sources": {
    "a" : "cmd param",
    "b": "cmd $a" // b refers to a
  }
}
```
* Apply [DAG](https://en.wikipedia.org/wiki/Directed_acyclic_graph) walker for consistency checks and processing.

</details>

## 🚧 Status
Working draft. The API may change significantly

## Key features
* Declarative notation. Atomic transformations. No syntax bloating by design.
* Injecting values using dot-prop paths
* Explicit CLI-like pipelines
* Customizable transformers (aka `cmds`)

## Install
```shell
yarn add topoconfig@draft
```

## Usage
```ts
import {topoconfig} from 'topoconfig'
import * as cmds from '@topoconfig/cmds' // optional

const config = await topoconfig({
  // define functions to use in pipelines: sync or async
  cmds: {
    foo: () => 'bar',
    baz: async (v) => v + 'qux',
    ...cmds
  },
  // pipelines to resolve intermediate variables
  sources: {
    a: 'foo > baz', // pipeline returns 'barqux'
    b: {            // b refers to b.data
      data: {
        c: {
          d: 'e'
        }
      }
    }
  },
  // output value
  data: {
    // $name.inner.path populates var ref with its value
    x: '$b.c.d',  // 'e'
    y: {
      z: '$a'     // 'barqux'
    }
  }
})
```

## Customization
Just as bash allows you to use any commands from the environment, so does topoconfig. Declare custom handlers for your pipelines. Real-world usage example may look like:

```ts
import {topoconfig} from 'topoconfig'

const config = await topoconfig({
  data: {
    foo:      '$a',
    url:      'https://some.url',
    param:    'regular param value',
    num:      123,
    pwd:      '\\$to.prevent.value.inject.use.\.prefix',
    a: {
      b:      '$b.some.nested.prop.value.of.b',
      c:      '$external.prop.of.prop'
    },
    log: {
      level:  `$loglevel`
    }
  },
  sources: {
    a:        'file ./file.json utf8',
    b:        'json $a',
    c:        'get $b > assert type number',
    cwd:      'cwd',
    schema:   'file $cwd/schema.json utf8 > json',
    external: 'fetch http://foo.example.com > get .body > json > get .prop > ajv $schema',
    extended: 'extend $b $external',
    loglevel: 'find $env.LOG_LEVEL $argv.log-level $argv.log.level info',
    template: `dot {{? $name }}
<div>Oh, I love your name, {{=$name}}!</div>
{{?? $age === 0}}
<div>Guess nobody named you yet!</div>
{{??}}
You are {{=$age}} and still don't have a name?
{{?}} > assert $foo`,
  },
  cmds: {
    // http://olado.github.io/doT/index.html
    dot:      (...chunks) => dot.template(chunks.join(' '))({}),
    extend:   Object.assign,
    cwd:      () => process.cwd(),
    file:     (file, opts) => fs.readFile(file, opts),
    json:     JSON.parse,
    get:      lodash.get,
    argv:     () => minimist(process.argv.slice(2)),
    env:      () => process.env,
    find:     (...args) => args.find(Boolean),
    fetch:    async (url) => {
      const res = await fetch(url)
      const code = res.status
      const headers = Object.fromEntries(res.headers)
      const body = await res.text()

      return {
        res,
        headers,
        body,
        code
      }
    },
    //...
  }
})
```

You can also use the default [@topoconfig/cmds](https://github.com/antongolub/misc/tree/master/packages/topoconfig/cmds) preset as a shortcut or create your own. No limitations.
```ts
import {topoconfig} from 'topoconfig'
import * as cmds from '@topoconfig/cmds'

const config = await topoconfig<ReturnType<typeof cmds.conf>>({
  cmds,
  data: '$output',
  sources: {
    // resolve a config file name by env profile 
    env: 'env',
    name: 'dot {{ $env.ENVIRONMENT_PROFILE_NAME || "config" }}.json',

    // read the config as json
    config: 'file $name > json',
    // read its schema
    schema: 'file schema.json > json',

    // and finally wrap the result with Conf API
    // https://github.com/antongolub/misc/tree/master/packages/topoconfig/cmds#conf
    output: 'conf $config $schema',
  }
})
```


## Notes
```ts
export type TData = number | string | { [key: string]: TData } | { [key: number]: TData }
export type TCmd = (...opts: any[]) => any
export type TCmds = Record<string | symbol, TCmd>
export type TConfigDeclaration = {
  data: TData,
  sources?: Record<string, string | TConfigDeclaration>
  cmds?: TCmds
}
```

`TConfigDeclaration` defines two sections: `data` and `sources`:
* `data` describes how to build the result value based on the bound sources: it populates `$`-prefixed refs with their values in every place.
* `sources` is a map, which declares the _algorithm_ to resolve intermediate values through `cmd` calls composition. To fetch data from remote, to read from file, to convert, etc.
```json
{
  "data": "$res",
  "sources": {
    "res": "fetch https://example.com > get .body > json"
  }
}
```
* `cmd` is a provider that performs a specific action.
```ts
type TCmd = (...opts: any[]) => any
```
* `directive` is a template for defining a value transformation pipeline
```
// fetch http://foo.example.com > get body > json > get .prop
// ↑ cmd ↑opts                  ↑ pipes delimiter
```

## Next steps
* Add ternaries: `cmd ? cmd1 > cmd2 ... : cmd`
* Handle _or_ statement: `cmd > cmd || cmd > cmd`
* 🚧 Provide commands presets: `import {cmds} from 'topoconfig/cmds'` or [@topoconfig/cmds](https://github.com/antongolub/misc/tree/master/packages/topoconfig/cmds)
* Provide lazy-loading for cmds:
```js
{
  cmds: {
    foo: 'some/package',
    bar: './local/plugin.js'
  }
}
```
* Provide pipeline factories as cmd declaration.
```js
{
  cmds: {
    readjson: 'path $0 resolve > file $1 > json'
  }
}
```
* Use vars as cmd refs:
```js
{
  sources: {
    files: 'glob ./*.*'
    reader: 'detect $files'
    foo: 'file $files.0 > $reader'
  }
}
```
* Bring smth like watchers to trigger graph re-resolution from the specified vertex

## Refs and Inspirations
* [cosmiconfig](https://github.com/cosmiconfig/cosmiconfig)
* [node-config](https://github.com/node-config/node-config)
* [uniconfig](https://github.com/qiwi/uniconfig)
* [toposource](https://github.com/semrel-extra/toposource)
* [symfony/config](https://github.com/symfony/config)
* [gookit/config](https://github.com/gookit/config)

## License
[MIT](./LICENSE)
