import path from 'node:path'
import semver from 'semver'
import {memoize, spawn} from '../util.ts'
import {TKeeper, TKeeperCtx, TResource} from '../interface.ts'
import {getResource, getPatch, loadResources} from '../common.ts'

const defaultScopes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

export const propose = async (ctx: TKeeperCtx) => {
  const {proposals, config} = ctx
  const {include, exclude, scope = defaultScopes} = config
  const pkgs = await getPackages(ctx)

  await Promise.all(pkgs.map(async ([resource, {deps}]) => {
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
  }))

  return ctx
}

export const script = async (ctx: TKeeperCtx) => {
  for (const proposal of ctx.proposals) {
    const {keeper, resource, data} = proposal
    if (keeper !== 'npm') {
      continue
    }
    const res = getResource(ctx, resource) as TResource
    const {contents} = res
    const {scope, name, version} = data
    const pkgJson = JSON.parse(contents)
    pkgJson[scope][name] = version
    res.contents = JSON.stringify(pkgJson, null, 2)

    // eslint-disable-next-line unicorn/consistent-destructuring
    proposal.script = await getPatch(contents.trim(), res.contents.trim(), resource, ctx.flags.diff)
  }

  return ctx
}

export const keeper: TKeeper = {
  propose,
  script
}

export const getPackages = async (ctx: TKeeperCtx) => {
  const pkgs: [string, {json: TPkgJson, deps: TDeps}][] = []
  const {config, cwd, resources} = ctx
  const manifests = config.resources.length === 0 ? ['package.json'] : config.resources

  resources.push(...(await loadResources(manifests, cwd)))

  for (const {name, contents} of resources) {
    if (!name.endsWith('package.json')) {
      continue
    }
    const json = JSON.parse(contents)
    if (json.workspaces) {
      resources.push(...await loadResources(
        json.workspaces.map((ws: string) => `${ws}/package.json`),
        path.resolve(cwd, path.dirname(name))
      ))
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
      // TODO decompose and patch semver ranges and npm: protocols
      if (version.includes(':') || version.includes('>') || version.includes('<') || version.includes('|')) {
        return
      }
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

export const getVersions = memoize(async (name: string): Promise<TVersions> => {
  const versions = JSON.parse((await spawn('npm', ['view', name, 'versions', '--json'], {silent: true, nothrow: true})).stdout.trim())

  return Array.isArray(versions) ? versions.sort(semver.rcompare) : []
})
