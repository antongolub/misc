import cp from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import semver from 'semver'

const defaultScopes = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies']

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
  const _limit = Number.parseInt(limit)
  const pkgJson = JSON.parse(await fs.readFile(path.resolve(cwd, target), 'utf8'))
  const deps = getDeps(pkgJson)
  const _deps = filterDeps(deps, ignore, match, scope)
  const versions = await getVersionsMap(_deps)

  const chunks: any[] = []
  for (let p = 0; p < _deps.length; p += _limit) {
    const __deps = deps.slice(p, _limit)
    const ___deps = updateDeps(__deps, versions)
    const _pkgJson = updatePkgJson(pkgJson, ___deps)
    const script = `
echo ${quote(JSON.stringify(_pkgJson, null, 2))} > ${target}
${commit}
`
    chunks.push(script)
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
    const _version = getLatestCompatibleVersion(version, versions[name]) || version
    return [name, _version, scope]
  })

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

export const spawn = (
  cmd: string,
  args: ReadonlyArray<string> = [],
  opts: Record<string, any> = {}
): Promise<{stdout: string, stderr: string}> => new Promise((resolve, reject) => {
  let status: number | null = 0
  const now = Date.now()
  const stderr: string[] = []
  const stdout: string[] = []
  const {nothrow, silent} = opts
  const p = cp.spawn(cmd, args, opts)

  p.stdout.on('data', (data) => stdout.push(data.toString()))
  p.stderr.on('data', (data) => stderr.push(data.toString()))

  p.on('error', (e) => stderr.push(e.toString()))
  p.on('exit', (code) => {
    status = code
  })
  p.on('close', () => {
    const result = {
      stderr: stderr.join(''),
      stdout: stdout.join(''),
      status: status,
      signalCode: p.signalCode,
      duration: Date.now() - now,
    }

    if (!silent) {
      result.stdout && console.log(result.stdout)
      result.stderr && console.error(result.stderr)
    }

    (status && !nothrow ? reject : resolve)(result)
  })
})

export function quote(arg: string) {
  // eslint-disable-next-line unicorn/better-regex
  if (/^[a-z0-9/_.\-@:=]+$/i.test(arg) || arg === '') {
    return arg
  }
  return (
    `$'` +
    arg
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\f/g, '\\f')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\v/g, '\\v')
      .replace(/\0/g, '\\0') +
    `'`
  )
}
