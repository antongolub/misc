import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {filterDeps, getDeps, getVersion, getVersionsMap, TDeps, upkeeper} from '../../main/ts'

describe('upkeeper()', () => {
  it('is callable', () => {
    assert.equal(typeof upkeeper, 'function')
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
    const versions = await getVersion('lcov-utils')
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
