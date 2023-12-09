import cp from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import semver from 'semver'
import glob from 'fast-glob'
import {spawn} from '../util.js'
import {TKeeperCtx} from '../interface.js'
import {loadResources} from "../common.js";

const defaultScopes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

const propose = async (ctx: TKeeperCtx) => {
  const pkgs = await getPackages(ctx)
}

const perform = async (ctx: TKeeperCtx) => {

}

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

export const upkeeper = async ({
   cwd = process.cwd(),
   target = 'package.json',
   scope = defaultScopes,
   match = [],
   ignore = [],
   commit = 'yarn install && git add . && git commit -m "chore(deps): update deps" && git push origin HEAD:refs/heads/up-deps',
   dryRun = false,
   limit = Number.POSITIVE_INFINITY
}: Record<string, any> = {}) => {
  const targets = await glob(asArray(target), {cwd})
  const opts = {cwd, target, scope, match, ignore, commit, dryRun, limit}
  const chunks: any[] = []
  for (const t of targets) {
    const _limit = Number.parseInt(limit)
    const pkgJson = JSON.parse(await fs.readFile(path.resolve(cwd, t), 'utf8'))
    const {workspaces = []} = pkgJson
    chunks.push(...await upkeeper({
      ...opts,
      target: workspaces.map((ws: string) => `${ws}/package.json`)
    }))

    const deps = getDeps(pkgJson)
    const _deps = filterDeps(deps, ignore, match, scope)
    const versions = await getVersionsMap(_deps)

    for (let p = 0; p < _deps.length; p += _limit) {
      const __deps = deps.slice(p, _limit)
      const ___deps = updateDeps(__deps, versions)
      if (___deps.length === 0) {
        continue
      }
      const updated = ___deps.map(([name, version]) => `${name}@${version}`).join(', ')
      const _commit = tpl(commit, {updated})
      const _pkgJson = updatePkgJson(pkgJson, ___deps)
      const script = `
echo ${quote(JSON.stringify(_pkgJson, null, 2))} > ${t}
${_commit}
`
      chunks.push(script)
    }
  }


  return chunks
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
  const entries = await Promise.all(names.map(async name => {
    return [name, await getVersion(name)]
  }))

  return Object.fromEntries(entries)
}

export const filterDeps = (deps: TDeps, ignore: string | string[], match: string | string[], scopes: string[]): TDeps => {
  const ignored = asArray(ignore)
  const matched = asArray(match)

  return deps.filter(([n, v, s]) => scopes.includes(s) && (matched.length === 0 || matched.includes(n)) && !ignored.includes(v))
}

export const updateDeps = (deps: TDeps, versions: TVersionsMap): TDeps =>
  deps.map(([name, version, scope]) => {
    const _version = getLatestCompatibleVersion(version, versions[name])
    if (_version) {
      return [name, _version, scope]
    }
  }).filter(Boolean) as TDeps

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

export const asArray = (value: string | string[]) => [value].flat().flatMap(i => i.split(','))

export const getVersion = async (name: string): Promise<TVersions> => {
  const versions = JSON.parse((await spawn('npm', ['view', name, 'versions', '--json'], {silent: true, nothrow: true})).stdout.trim())

  return Array.isArray(versions) ? versions.sort(semver.rcompare) : []
}

