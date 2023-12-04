import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import { normalizeConfig, loadConfig, populateExtras } from '../../main/ts/config.ts'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { cosmiconfig } from 'cosmiconfig'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')

describe('normalizeConfig()', () => {
  it('loads plugins', async () => {
    const rawConfig = {}
    const normalizedConfig = await normalizeConfig(rawConfig)
    const expectedConfig = {
      plugins: []
    }
    assert.deepEqual(normalizedConfig, expectedConfig)
  })
})

describe('loadConfig()', () => {
  // eslint-disable-next-line unicorn/consistent-function-scoping
  const mapPlugins = ({plugins}) => plugins.map((v, i) => (plugins[i] = v.name))
  const expectedConfig = {
    plugins: [nodeExternalsPlugin()]
  }
  const cases = [
    ['cjs', 'esbuild.config.cjs'],
    ['esm', 'esbuild.config.mjs'],
    ['esm + plugin', 'esbuild-p.config.mjs'],
    ['esm + plugin factory', 'esbuild-pf.config.mjs'],
    ['json']
  ]

  mapPlugins(expectedConfig)

  for (const [type, searchPlaces] of cases) {
    it(`loads ${type} config`, async () => {
      const config = await loadConfig({
        cwd: fixtures,
        searchPlaces
      })
      mapPlugins(config)
      assert.deepEqual(config, expectedConfig)
    })
  }
})

describe('populateExtras', () => {
  const cases: [string, Parameters<typeof populateExtras>, any][] = [
    [
      'resolves `extends` directives and injects them into the target',
      [
        {
          a: 'a',
          extends: '../fixtures/extend/extra3.mjs'
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
          extends: '../fixtures/extend/extra1.json'
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
    ]
  ];

  for (const [name, [config, opts], exptected] of cases) {
    it(name, async () => {
      const result = await populateExtras(config, opts)
      assert.deepEqual(result, exptected)
    })
  }
})
