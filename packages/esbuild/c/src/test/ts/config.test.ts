import * as assert from 'node:assert'
import * as path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import { normalizeConfig, loadConfig } from '../../main/ts/config.ts'

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
  const pluginsAsNames = ({plugins}) => plugins.forEach((v, i) => (plugins[i] = v.name))
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

  pluginsAsNames(expectedConfig)

  for (const [type, searchPlaces] of cases) {
    it(`loads ${type} config`, async () => {
      const config = await loadConfig({
        cwd: fixtures,
        searchPlaces
      })
      pluginsAsNames(config)
      assert.deepEqual(config, expectedConfig)
    })
  }
})
