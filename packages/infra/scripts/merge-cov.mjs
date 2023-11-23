import fs from 'node:fs/promises'
import path from 'node:path'
import glob from 'fast-glob'
import minimist from 'minimist'
import { merge, parse, format, sum } from 'lcov-utils'

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

const lcovs = await Promise.all(
  files.map(async f => {
    const contents = await fs.readFile(f, 'utf8')
    const prefix = (sf) => path.relative(cwd, path.join(cwd, 'packages/infra', sf))
    return parse(contents, {prefix})
  })
)
const lcov = merge(...lcovs)

await fs.writeFile(outFile, format(lcov), 'utf8')

async function getWsCoveragePaths(cwd) {
  const workspaces = JSON.parse(await fs.readFile(path.resolve(cwd, 'package.json'), 'utf8'))?.workspaces || []
  return workspaces.map(w => [`${w}/coverage/lcov.info`, `${w}/target/coverage/lcov.info`]).flat()
}

console.log(sum(lcov))
