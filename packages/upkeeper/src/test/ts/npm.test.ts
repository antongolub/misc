import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {
  filterDeps,
  getPackages,
  getDeps,
  getLatestCompatibleVersion,
  getVersions,
  getVersionsMap,
  TDeps,
  updateDeps,
  updatePkgJson,
  propose,
  perform
} from '../../main/ts/keepers/npm'
import {TKeeperCtx} from '../../main/ts/interface'
import * as path from 'node:path'
import {fileURLToPath} from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('`getPackages`', () => {
  it('loads ws packages and returns them as json set', async () => {
    const ctx: TKeeperCtx = {
      cwd: path.resolve(__dirname, '../fixtures/mr'),
      resources: [
        {
          name: 'package.json',
          contents: JSON.stringify({
            name: 'mr',
            workspaces: ['packages/*']
          })
        }
      ],
      proposals: [],
      configs: []
    }
    const pkgs = (await getPackages(ctx)).sort(([a], [b]) => a.localeCompare(b))

    assert.deepEqual(pkgs[0], [ 'package.json', { json: {name: 'mr', workspaces: ['packages/*']}, deps: [] } ])
    assert.deepEqual(pkgs[1], [ 'packages/app/package.json', { json: {name: '@qiwi/pijma-app', version: '1.6.0', license: 'MIT'}, deps: [] } ])
  })
})

describe('`propose`', () => {
  it('generates deps update proposals', async () => {
    const ctx: TKeeperCtx = {
      cwd: path.resolve(__dirname, '../fixtures/mr'),
      resources: [
        {
          name: 'package.json',
          contents: JSON.stringify({
            name: 'mr',
            workspaces: ['packages/*']
          })
        }
      ],
      proposals: [],
      configs: []
    }
    const {proposals} = await propose(ctx)
    assert.deepEqual(proposals[0], {
      keeper: 'npm',
      action: 'update',
      resource: 'packages/core/package.json',
      data: {
        name: '@emotion/css',
        version: proposals[0].data.version,
        scope: 'dependencies'
      }
    })
  })
})

describe('`perform`', () => {
  it('modifies resources according to proposals', async () => {
    const ctx: TKeeperCtx = {
      cwd: path.resolve(__dirname, '../fixtures/mr'),
      resources: [
        {
          name: 'package.json',
          contents: JSON.stringify({
            name: 'mr',
            dependencies: {
              '@emotion/css': '^11.0.0'
            }
          })
        }
      ],
      proposals: [{
        keeper: 'npm',
        action: 'update',
        resource: 'package.json',
        data: {
          name: '@emotion/css',
          version: '^11.2.0',
          scope: 'dependencies'
        }
      }],
      configs: []
    }
    await perform(ctx)

    const pkgJson = JSON.parse(ctx.resources[0].contents)
    assert.equal(pkgJson.dependencies['@emotion/css'], '^11.2.0')
  })
})

describe('`getDeps`', () => {
  it('returns pkg deps', () => {
    assert.deepEqual(getDeps({
      dependencies: {
        foo: '1.0.0'
      },
      devDependencies: {
        bar: '2.0.0'
      }
    }), [
      ['foo', '1.0.0', 'dependencies'],
      ['bar', '2.0.0', 'devDependencies']
    ])
  })
})

describe('`filterDeps`', () => {
  it('returns filtered deps', () => {
    assert.deepEqual(
      filterDeps([
        ['foo', '1.0.0', 'dependencies'],
        ['bar', '2.0.0', 'devDependencies']
      ],
        [],
        [],
        ['dependencies']
      ),
      [
        ['foo', '1.0.0', 'dependencies']
    ])
  })
})

describe('`getVersion`', () => {
  it('returns known pkg versions', async () => {
    const versions = await getVersions('lcov-utils')
    assert.ok(versions.includes('0.0.1'))
    assert.ok(versions.includes('0.0.0'))
  })
})

describe('`getVersionsMap`', () => {
  it('returns versions for pkgs set', async () => {
    const deps: TDeps = [
      ['lcov-utils', '1.0.0', 'dependencies'],
      ['topoconfig', '2.0.0', 'devDependencies']
    ]
    const versions = await getVersionsMap(deps)
    assert.ok(versions['lcov-utils'].includes('0.0.1'))
  })
})


describe('`updateDeps`', () => {
  it('update deps by the specified rules', async () => {
    const deps: TDeps = [
      ['lcov-utils', '^1.0.0', 'dependencies'],
      ['topoconfig', '^2.0.0', 'devDependencies']
    ]
    const versions = {
      'lcov-utils': ['1.2.3', '1.0.0', '0.0.1', '0.0.0'],
      'topoconfig': ['3.0.0', '2.5.0', '2.0.0', '1.0.0']
    }

    const _deps = updateDeps(deps, versions)

    assert.ok(_deps[0][1] === '^1.2.3')
    assert.ok(_deps[1][1] === '^2.5.0')
  })
})

describe('`getLatestCompatibleVersion`', () => {
  it('returns latest range-compatible version of the specified set', () => {
    const range = '^1.0.0'
    const versions = ['2.0.0', '1.2.3', '1.1.0', '1.0.0']
    const found = getLatestCompatibleVersion(range, versions)

    assert.equal(found, '^1.2.3')
  })
})

describe('`updatePkgJson`', () => {
  it('returns updated pkg json', () => {
    const pkg = {
      dependencies: {
        foo: '^1.0.0'
      },
      devDependencies: {
        bar: '^2.0.0'
      }
    }
    const deps: TDeps = [
      ['foo', '^1.2.3', 'dependencies'],
      ['bar', '^2.5.0', 'devDependencies']
    ]
    const _pkg = updatePkgJson(pkg, deps)

    assert.deepEqual(_pkg, {
      dependencies: {
        foo: '^1.2.3'
      },
      devDependencies: {
        bar: '^2.5.0'
      }
    })
  })
})
