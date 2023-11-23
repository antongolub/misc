import fs from 'node:fs/promises'
import path from 'node:path'
import glob from 'fast-glob'
import minimist from 'minimist'
import { merge, parse, format, sum, collide } from 'lcov-utils'

const {GITHUB_TOKEN, GH_TOKEN = GITHUB_TOKEN} = process.env
const {_: patterns, cwd = process.cwd(), output = 'lcov.info'} = minimist(process.argv.slice(2), {
  string: ['cwd', 'output']
})
const paths = patterns.length > 0
  ? patterns
  : await getWsCoveragePaths(cwd)

const outFile = path.resolve(cwd, output)
const files = (await glob(paths, {
  cwd,
  absolute: true,
  onlyFiles: true
}))

if (files.length === 0) {
  console.log('No coverage update')
  process.exit(0)
}

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
  const prevLcovStr = (await fetch('https://github.com/antongolub/misc/releases/download/lcov/lcov.info')).text()
  const prevLcov = parse(prevLcovStr)
  lcov = collide(prevLcov, ...lcovs)
} catch {
  lcov = merge(...lcovs.map(([l]) => l))
}

const lcovStr = format(lcov)

await fs.writeFile(outFile, lcovStr, 'utf8')

async function getWsCoveragePaths(cwd) {
  const workspaces = JSON.parse(await fs.readFile(path.resolve(cwd, 'package.json'), 'utf8'))?.workspaces || []
  return workspaces.map(w => [`${w}/coverage/lcov.info`, `${w}/target/coverage/lcov.info`]).flat()
}

if (GH_TOKEN) {
  const release = await (await fetch('https://api.github.com/repos/antongolub/misc/releases/tags/lcov')).json()
  const uploadUrl = release.upload_url.slice(0, release.upload_url.indexOf('{')) + '?name=lcov.info'
  const found = release.assets.find(a => a.name === 'lcov.info')

  if (found) {
    await fetch(found.url, {
      method: 'DELETE',
      headers: {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${GH_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28'
      },
    })
  }

  await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${GH_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28'
    },
    body: lcovStr
  })
}

console.log(sum(lcov))
