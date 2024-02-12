import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'
import { populate, populateSync, parseOpts } from '../../main/ts/populate.ts'
import { cosmiconfig, cosmiconfigSync } from 'cosmiconfig'
import { load as parseYaml } from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const __require = createRequire(import.meta.url)
const fixtures = path.resolve(__dirname, '../fixtures')

describe('parseOpts() ', () => {
  it('detects Rules and PopulateOpts', () => {
    assert.deepEqual(
      parseOpts({foo: 'merge', bar: 'override'}),
      {rules: {foo: 'merge', bar: 'override'}}
    )
    assert.deepEqual(
      parseOpts({rules: {foo: 'merge', bar: 'override'}}),
      {rules: {foo: 'merge', bar: 'override'}}
    )
  })
})

describe('populate()', () => {
  class Foo {}
  const foo = new Foo()
  const cases: [string, Parameters<typeof populate>, any][] = [
    [
      'resolves `extends` directives and injects them into the target',
      [
        {
          a: 'a',
          extends: '../fixtures/extra3.mjs'
        },
        {cwd: __dirname}
      ],
      {
        a: 'a',
        baz: 'qux'
      }
    ],
    [
      'configuration\'s own values take precedence over extras',
      [
        {
          a: 'A',
          extends: [
            {a: 'a', b: 'b'},
          ]
        }
      ],
      {
        a: 'A',
        b: 'b'
      }
    ],
    [
      'keeps prototype',
      [
        foo,
        {
          extends: [
            {a: 'a', b: 'b'},
          ]
        }
      ],
      {
        a: 'a',
        b: 'b',
      }
    ],
    [
      'multiple `extends` works',
      [
        {
          a: 'a',
          extends: ['../fixtures/extra3.mjs', '../fixtures/extra6.cjs']
        },
        {cwd: __dirname}
      ],
      {
        a: 'a',
        baz: 'qux',
        foo: 'bar',
        arr1: [3, 4],
        arr2: ["c", "d"]
      }
    ],
    [
      'aliases `preset` as `extends` directive',
      [
        {
          b: 'b',
          preset: '../fixtures/extra3.mjs'
        },
        {cwd: __dirname, rules: {preset: 'populate'}}
      ],
      {
        b: 'b',
        baz: 'qux'
      }
    ],
    [
      'no extends - no effects',
      [
        {
          a: 'a',
        },
        {}
      ],
      {
        a: 'a',
      }
    ],

    [
      'loads config from external package (shared config)',
      [
        {
          extends: 'eslint-config-qiwi',
          a: 'a'
        },
        {}
      ],
      {
        a: 'a',
        ...__require('eslint-config-qiwi')
      }
    ],
    [
      'loads config from external package with its own relative `extends`',
      [
        {
          extends: '@fixtures/config-with-extends',
          a: 'a'
        },
        {}
      ],
      {
        a: 'a',
        foo: 'bar'
      }
    ],
    [
      'applies a custom loader if specified',
      [
        {
          a: 'a',
          extends: '../fixtures/extra1.json'
        },
        {
          cwd: __dirname,
          load: async ({id, cwd}) => (await cosmiconfig('foo', {
            searchPlaces: [id]
          }).search(cwd))?.config
        }
      ],
      {
        a: 'a',
        baz: 'qux'
      }
    ],
    [
      'applies a custom parser if specified',
      [
        {
          a: 'a',
          extends: '../fixtures/extra4.yaml'
        },
        {
          cwd: __dirname,
          parse: ({id, contents}) =>
            (id.endsWith('.yaml') || id.endsWith('.yml'))
              ? parseYaml(contents)
              : {}
        }
      ],
      {
        a: 'a',
        b: 'b'
      }
    ],
    [
      'loads a config from a file',
      [path.resolve(fixtures, 'extra1.json')],
      {
        baz: 'qux'
      }
    ],
    [
      'handles looped refs',
      [path.resolve(fixtures, 'extra-looped.json')],
      {a: 'a'}
    ],
    [
      'works with cosmiconfic search API',
      [
        {
          a: 'a',
          extends: '../fixtures/extra1.json'
        },
        {
          cwd: __dirname,
          load: async ({id, cwd}) =>
            (await cosmiconfig('foobar').load(path.resolve(cwd, id)))?.config
        },
      ],
      {
        a: 'a',
        baz: 'qux'
      }
    ],
    [
      'the shortest cosmiconfig wrapper',
      [
        'cosmiconfig:foobar',
        {
          cwd: fixtures,
          async load ({cwd}){
            return (await cosmiconfig('foobar').search(cwd))?.config
          }
        },
      ],
      {
        foobar: 'baz'
      }
    ],
    [
      'cosmiconfig as resolver',
      [
        'cosmiconfig:foobar',
        {
          cwd: fixtures,
          resolve({cwd}) {
            return cosmiconfigSync('foobar').search(cwd).filepath
          }
        },
      ],
      {
        foobar: 'baz'
      }
    ],
    [
      'resolves tsconfig.json',
      [
        {},
        {
          cwd: __dirname,
          load: async ({id, cwd}) => (await cosmiconfig('foo', {
            searchPlaces: [id]
          }).search(cwd))?.config,
          extends: ['../../../tsconfig.json'],
          rules: {
            compilerOptions: 'merge'
          }
        }
      ],
      {
        'ts-node': {
          files: true,
          transpileOnly: true
        },
        compilerOptions: {
          allowImportingTsExtensions: true,
          allowJs: false,
          baseUrl: './src/main/ts/',
          declaration: true,
          esModuleInterop: true,
          forceConsistentCasingInFileNames: true,
          module: 'nodenext',
          moduleResolution: 'nodenext',
          noImplicitAny: true,
          rootDir: './src/main/ts/',
          strict: true,
          target: 'esnext'
        },
        exclude: [
          'node_modules',
          'src/test'
        ],
        include: [
          'src/main/ts/'
        ]
      }
    ],
    [
      'applies rules shortcut',
      [
        {
          extends: [
            {a: {b: {foo: 'foo'}}},
            {a: {b: {bar: 'bar'}, c: 'c'}},
            {a: {b: {baz: 'baz'}, c: 'C'}},
          ]
        },
        {
          rules: {
            a: 'merge',
            'a.b': 'merge'
          },
          extends: [
            {a: {b: {qux: 'qux'}}},
          ]
        }
      ],
      {
        a: {
          b: {
            foo: 'foo',
            bar: 'bar',
            baz: 'baz',
            qux: 'qux'
          },
          c: 'C'
        }
      }
    ]
  ];

  for (const [name, [config, opts], exptected] of cases) {
    it(name, async () => {
      const result = await populate(config, opts)
      assert.deepEqual(result, exptected)

      if (typeof config !== 'string') {
        assert.ok(result instanceof config.constructor)
        assert.ok(result.constructor === config.constructor)
      }
    })
  }
})

describe('populateSync()', () => {
  const cases: [string, Parameters<typeof populate>, any][] = [
    [
      'loads a config from a file',
      [path.resolve(fixtures, 'extra5.json'), {arr1: 'merge', arr2: 'override'}],
      {
        foo: 'bar',
        arr1: [3, 4, 1, 2],
        arr2: ['a', 'b']
      }
    ],
    [
      'resolves tsconfig.json',
      [
        {},
        {
          cwd: __dirname,
          load: ({id, cwd}) => cosmiconfigSync('foo', {
            searchPlaces: [id]
          }).search(cwd)?.config,
          extends: ['../../../tsconfig.json'],
          rules: {
            compilerOptions: 'merge'
          }
        }
      ],
      {
        'ts-node': {
          files: true,
          transpileOnly: true
        },
        compilerOptions: {
          allowImportingTsExtensions: true,
          allowJs: false,
          baseUrl: './src/main/ts/',
          declaration: true,
          esModuleInterop: true,
          forceConsistentCasingInFileNames: true,
          module: 'nodenext',
          moduleResolution: 'nodenext',
          noImplicitAny: true,
          rootDir: './src/main/ts/',
          strict: true,
          target: 'esnext'
        },
        exclude: [
          'node_modules',
          'src/test'
        ],
        include: [
          'src/main/ts/'
        ]
      }
    ],
    [
      'applies rules shortcut',
      [
        {
          extends: [
            {a: {b: {foo: 'foo'}}},
            {a: {b: {bar: 'bar'}, c: 'c'}},
            {a: {b: {baz: 'baz'}, c: 'C'}},
          ]
        },
        {
          rules: {
            a: 'merge',
            'a.b': 'merge'
          },
          extends: [
            {a: {b: {qux: 'qux'}}},
          ]
        }
      ],
      {
        a: {
          b: {
            foo: 'foo',
            bar: 'bar',
            baz: 'baz',
            qux: 'qux'
          },
          c: 'C'
        }
      }
    ]
  ];

  for (const [name, [config, opts], exptected] of cases) {
    it(name, () => {
      const result = populateSync(config, opts)
      assert.deepEqual(result, exptected)
    })
  }
})
