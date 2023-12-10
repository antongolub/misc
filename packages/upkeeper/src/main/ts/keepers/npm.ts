import path from 'node:path'
import semver from 'semver'
import {spawn} from '../util.js'
import {TKeeperCtx, TResource} from '../interface.js'
import {getResource, getScript, loadResources} from '../common.js'

const defaultScopes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

export const propose = async (ctx: TKeeperCtx) => {
  const {proposals} = ctx
  const pkgs = await getPackages(ctx)
  const {include, exclude, scope} = getConfig(ctx)

  for (const [resource, {deps}] of pkgs) {
    const filteredDeps = filterDeps(deps, include, exclude, scope)
    const versions = await getVersionsMap(filteredDeps)
    const updatedDeps = updateDeps(filteredDeps, versions)

    for (const [name, version, scope] of updatedDeps) {
      proposals.push({
        keeper: 'npm',
        action: 'update',
        resource,
        data: {name, version, scope}
      })
    }
  }

  return ctx
}

export const script = async (ctx: TKeeperCtx) => {
  for (const proposal of ctx.proposals) {
    const {keeper, resource, data} = proposal
    if (keeper !== 'npm') {
      continue
    }
    const {contents} = getResource(ctx, resource) as TResource
    const {scope, name, version} = data
    const pkgJson = JSON.parse(contents)
    pkgJson[scope][name] = version
    const _contents = JSON.stringify(pkgJson, null, 2)

    proposal.script = await getScript(contents, _contents, resource)
  }
}

export const perform = async (ctx: TKeeperCtx) => {
  for (const {keeper, resource, data} of ctx.proposals) {
    if (keeper !== 'npm') {
      continue
    }
    const resourceRef = getResource(ctx, resource) as TResource
    const {scope, name, version} = data
    const pkgJson = JSON.parse(resourceRef.contents)
    pkgJson[scope][name] = version
    resourceRef.contents = JSON.stringify(pkgJson, null, 2)
  }
}

const getConfig = (ctx: TKeeperCtx) => ({
  include: [],
  exclude: [],
  scope: defaultScopes,
  ...ctx.configs.find(c => c.keeper === 'npm')?.options
})

export const getPackages = async (ctx: TKeeperCtx) => {
  const pkgs: [string, {json: TPkgJson, deps: TDeps}][] = []
  for (const {name, contents} of ctx.resources) {
    if (!name.endsWith('package.json')) {
      continue
    }
    const json = JSON.parse(contents)
    if (json.workspaces) {
      const {resources: _extraResources} = await loadResources({
        ...ctx,
        cwd: path.resolve(ctx.cwd, path.dirname(name)),
        resources: json.workspaces.map((ws: string) => ({name: `${ws}/package.json`}))
      })
      ctx.resources.push(..._extraResources)
    }
    pkgs.push([name, {json, deps: getDeps(json)}])
  }

  return pkgs
}

export type TPkgJson = Record<string, any>
export type TDeps = [string, string, string][]
export type TVersions = string[]
export type TVersionsMap = Record<string, string[]>

export const getDeps = (pkgJson: TPkgJson): TDeps => {
  const deps: TDeps = []
  for (const scope of defaultScopes) {
    for(const [name, version] of Object.entries(pkgJson[scope] || {})) {
      deps.push([name, version as string, scope])
    }
  }

  return deps
}

export const getVersionsMap = async (deps: TDeps): Promise<TVersionsMap> => {
  const names = [...new Set(deps.map((e => e[0])))]
  const entries = await Promise.all(names.map(async name =>
    ([name, await getVersions(name)])))

  return Object.fromEntries(entries)
}

export const filterDeps = (deps: TDeps, include: string[], exclude: string[], scopes: string[]): TDeps =>
  deps
    .filter(([n, v, s]) =>
      scopes.includes(s) && (include.length === 0 || include.includes(n)) && !exclude.includes(v))

export const updateDeps = (deps: TDeps, versions: TVersionsMap): TDeps =>
  deps
    .map(([name, version, scope]) => {
      const _version = getLatestCompatibleVersion(version, versions[name])
      if (_version && _version !== version) {
        return [name, _version, scope]
      }
    })
    .filter(Boolean) as TDeps

export const getLatestCompatibleVersion = (v: string, versions: string[]): string | undefined => {
  const caret = v.startsWith('^') || v.startsWith('~') ? v[0] : ''
  return caret + versions.find(_v => semver.satisfies(_v, v))
}

export const updatePkgJson = (pkg: TPkgJson, deps: TDeps) => {
  const _pkg: TPkgJson = JSON.parse(JSON.stringify(pkg))
  for(const [name, version, scope] of deps) {
    _pkg[scope][name] = version
  }

  return _pkg
}

export const getVersions = async (name: string): Promise<TVersions> => {
  const versions = JSON.parse((await spawn('npm', ['view', name, 'versions', '--json'], {silent: true, nothrow: true})).stdout.trim())

  return Array.isArray(versions) ? versions.sort(semver.rcompare) : []
}
