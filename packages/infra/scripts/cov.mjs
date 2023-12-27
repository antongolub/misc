import fs from 'node:fs/promises'
import fss from 'node:fs'
import path from 'node:path'
import util from 'node:util'
import glob from 'fast-glob'
import minimist from 'minimist'
import { merge, parse, format, sum, collide } from 'lcov-utils'

const fsExists = util.promisify(fss.exists)

const {GITHUB_TOKEN, GH_TOKEN = GITHUB_TOKEN} = process.env
const {_: patterns, cwd = process.cwd(), output = 'lcov.info', outputSum = 'lcov-sum.json'} = minimist(process.argv.slice(2), {
  string: ['cwd', 'output', 'output-sum']
})
const spaces = await getWs(cwd)
const paths = patterns.length > 0
  ? patterns
  : await getWsCoveragePaths(cwd, spaces)
const files = await glob(paths, {
  cwd,
  absolute: true,
  onlyFiles: true
})
const lcovs = await Promise.all(
  files.map(async f => {
    const contents = await fs.readFile(f, 'utf8')
    const prefix = (sf) => path.relative(cwd, path.join(cwd, 'packages/infra', sf))
    const scope = path.relative(cwd, path.resolve(path.dirname(f), '../..'))
    return [parse(contents, {prefix}), scope]
  })
)

let lcov

try {
  const prevLcovStr = await (await fetch('https://github.com/antongolub/misc/releases/download/lcov/lcov.info')).text()
  const prevLcov = parse(prevLcovStr)
  lcov = collide(prevLcov, ...lcovs)
} catch (e) {
  lcov = merge(...lcovs.map(([l]) => l))
}

lcov = Object.fromEntries((await Promise.all(Object.entries(lcov).map(async ([k, v]) =>
  await fsExists(path.resolve(cwd, k))
    ? [k, v]
    : false
))).filter(Boolean))

const lcovSum = sum(lcov)
lcovSum.scopes = spaces.reduce((acc, scope) => {
  const _scope = path.relative(cwd, scope)
  const _lcov = Object.fromEntries(Object.entries(lcov).filter(([k, v]) => k.startsWith(_scope) && [k, v]))
  const key = _scope
    .replaceAll('/', '_')
    .replaceAll('-', '_')

  if (Object.keys(_lcov).length !== 0) {
    acc[key] = sum(_lcov)
  }

  return acc
}, {})

const lcovStr = format(lcov)
const lcovSumStr = JSON.stringify(lcovSum, null, 2)
const lcovFile = path.resolve(cwd, output)
const lcovSumFile = path.resolve(cwd, outputSum)

await fs.writeFile(lcovFile, lcovStr, 'utf8')
await fs.writeFile(lcovSumFile, lcovSumStr, 'utf8')

console.log('Coverage:', sum(lcov))

if (files.length === 0) {
  console.log('No coverage update required')
  process.exit(0)
}

if (GH_TOKEN) {
  const release = await (await fetch('https://api.github.com/repos/antongolub/misc/releases/tags/lcov')).json()
  const assets = [
    [output, lcovStr],
    [outputSum, lcovSumStr]
  ]

  for (const [name, contents] of assets) {
    await uploadAsset(release, name, contents)
  }
}

async function getWs(cwd) {
  const spaces = (JSON.parse(await fs.readFile(path.resolve(cwd, 'package.json'), 'utf8'))?.workspaces || [])
    .map(p => `${p}/package.json`)

  return (await glob(spaces, {
    onlyFiles: true,
    absolute: true
  }))
    .map(path.dirname)
}
async function getWsCoveragePaths(cwd, ws) {
  const workspaces = ws || await getWs(cwd)
  return workspaces.map(w => [`${w}/coverage/lcov.info`, `${w}/target/coverage/lcov.info`]).flat()
}

async function uploadAsset(release, name, contents) {
  const uploadUrl = release.upload_url.slice(0, release.upload_url.indexOf('{')) + `?name=${name}`
  const found = release.assets.find(a => a.name === name)
  const headers = {
    Accept: 'application/vnd.github.v3+json',
    Authorization: `Bearer ${GH_TOKEN}`,
    'X-GitHub-Api-Version': '2022-11-28'
  }

  if (found) {
    await fetch(found.url, {
      method: 'DELETE',
      headers,
    })
  }

  const res = await (await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      ...headers
    },
    body: contents
  })).json()

  console.log(`uploaded: ${res.browser_download_url} via ${uploadUrl}`)
}
