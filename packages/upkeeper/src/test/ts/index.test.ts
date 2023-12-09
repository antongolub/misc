// import * as assert from 'node:assert'
// import { describe, it } from 'node:test'
// import {
//   filterDeps,
//   getDeps,
//   getLatestCompatibleVersion,
//   getVersion,
//   getVersionsMap,
//   TDeps,
//   updateDeps, updatePkgJson,
//   upkeeper
// } from '../../main/ts'
//
// describe('upkeeper()', () => {
//   it('is callable', () => {
//     assert.equal(typeof upkeeper, 'function')
//   })
// })
//
// describe('`getDeps`', () => {
//   it('returns pkg deps', () => {
//     assert.deepEqual(getDeps({
//       dependencies: {
//         foo: '1.0.0'
//       },
//       devDependencies: {
//         bar: '2.0.0'
//       }
//     }), [
//       ['foo', '1.0.0', 'dependencies'],
//       ['bar', '2.0.0', 'devDependencies']
//     ])
//   })
// })
//
// describe('`filterDeps`', () => {
//   it('returns filtered deps', () => {
//     assert.deepEqual(
//       filterDeps([
//         ['foo', '1.0.0', 'dependencies'],
//         ['bar', '2.0.0', 'devDependencies']
//       ],
//         [],
//         [],
//         ['dependencies']
//       ),
//       [
//         ['foo', '1.0.0', 'dependencies']
//     ])
//   })
// })
//
// describe('`getVersion`', () => {
//   it('returns known pkg versions', async () => {
//     const versions = await getVersion('lcov-utils')
//     assert.ok(versions.includes('0.0.1'))
//     assert.ok(versions.includes('0.0.0'))
//   })
// })
//
// describe('`getVersionsMap`', () => {
//   it('returns versions for pkgs set', async () => {
//     const deps: TDeps = [
//       ['lcov-utils', '1.0.0', 'dependencies'],
//       ['topoconfig', '2.0.0', 'devDependencies']
//     ]
//     const versions = await getVersionsMap(deps)
//     assert.ok(versions['lcov-utils'].includes('0.0.1'))
//   })
// })
//
//
// describe('`updateDeps`', () => {
//   it('update deps by the specified rules', async () => {
//     const deps: TDeps = [
//       ['lcov-utils', '^1.0.0', 'dependencies'],
//       ['topoconfig', '^2.0.0', 'devDependencies']
//     ]
//     const versions = {
//       'lcov-utils': ['1.2.3', '1.0.0', '0.0.1', '0.0.0'],
//       'topoconfig': ['3.0.0', '2.5.0', '2.0.0', '1.0.0']
//     }
//
//     const _deps = updateDeps(deps, versions)
//
//     assert.ok(_deps[0][1] === '^1.2.3')
//     assert.ok(_deps[1][1] === '^2.5.0')
//   })
// })
//
// describe('`getLatestCompatibleVersion`', () => {
//   it('returns latest range-compatible version of the specified set', () => {
//     const range = '^1.0.0'
//     const versions = ['2.0.0', '1.2.3', '1.1.0', '1.0.0']
//     const found = getLatestCompatibleVersion(range, versions)
//
//     assert.equal(found, '^1.2.3')
//   })
// })
//
// describe('`updatePkgJson`', () => {
//   it('returns updated pkg json', () => {
//     const pkg = {
//       dependencies: {
//         foo: '^1.0.0'
//       },
//       devDependencies: {
//         bar: '^2.0.0'
//       }
//     }
//     const deps: TDeps = [
//       ['foo', '^1.2.3', 'dependencies'],
//       ['bar', '^2.5.0', 'devDependencies']
//     ]
//     const _pkg = updatePkgJson(pkg, deps)
//
//     assert.deepEqual(_pkg, {
//       dependencies: {
//         foo: '^1.2.3'
//       },
//       devDependencies: {
//         bar: '^2.5.0'
//       }
//     })
//   })
// })
