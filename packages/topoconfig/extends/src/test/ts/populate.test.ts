import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { populate, populateSync } from '../../main/ts/index.ts'
import { cosmiconfig, cosmiconfigSync } from 'cosmiconfig'
import { load as parseYaml } from 'js-yaml'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')

describe('populate()', () => {
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
      'applies a custom loader if specified',
      [
        {
          a: 'a',
          extends: '../fixtures/extra1.json'
        },
        {
          cwd: __dirname,
          load: async (id: string, cwd: string) => (await cosmiconfig('foo', {
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
          parse: (name, contents) =>
            (name.endsWith('.yaml') || name.endsWith('.yml'))
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
      'works with cosmiconfic search API',
      [
        {
          a: 'a',
          extends: '../fixtures/extra1.json'
        },
        {
          cwd: __dirname,
          load: async (f: string, cwd: string) =>
            (await cosmiconfig('foobar').load(path.resolve(cwd, f)))?.config
        },
      ],
      {
        a: 'a',
        baz: 'qux'
      }
    ],
    [
      'the shortest comsmiconfig wrapper',
      [
        '*.rc',
        {
          cwd: fixtures,
          load: async (f: string, cwd: string) =>
            (await cosmiconfig('foobar').search(cwd))?.config
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
          load: async (id: string, cwd: string) => (await cosmiconfig('foo', {
            searchPlaces: [id]
          }).search(cwd))?.config,
          extends: ['../../../tsconfig.json'],
          merge: {
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
        arr1: [1, 2, 3, 4],
        arr2: ['c', 'd']
      }
    ],
    [
      'resolves tsconfig.json',
      [
        {},
        {
          cwd: __dirname,
          load: (id: string, cwd: string) => cosmiconfigSync('foo', {
            searchPlaces: [id]
          }).search(cwd)?.config,
          extends: ['../../../tsconfig.json'],
          merge: {
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
          merge: {
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
