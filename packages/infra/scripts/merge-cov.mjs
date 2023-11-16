import fs from 'node:fs/promises'
import path from 'node:path'
import glob from 'fast-glob'
import minimist from 'minimist'
import parseLcov from 'parse-lcov'
import { mergeCoverageReportFiles } from 'lcov-result-merger'

const {default: parse} = parseLcov

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
})).slice(0, 1)
const tempFile = await mergeCoverageReportFiles(files, {
  prependSourceFiles: true,
  prependPathFix: '../../'
})

// This works weirdly, we need to find a better way to do this
// await fs.unlink(outFile)
// await fs.rename(tempFile, outFile)
console.log(sumCov(await fs.readFile(outFile, 'utf8')))

async function getWsCoveragePaths(cwd) {
  const workspaces = JSON.parse(await fs.readFile(path.resolve(cwd, 'package.json'), 'utf8'))?.workspaces || []
  return workspaces.map(w => [`${w}/coverage/lcov.info`, `${w}/target/coverage/lcov.info`]).flat()
}

function sumCov(lcov) {
  const coverage = parse(lcov)
  // console.log('coverage', coverage)
  const summary = {
    lines: { found: 0, hit: 0 },
    branches: { found: 0, hit: 0 },
    functions: { found: 0, hit: 0 },
  };
  const keys = Object.keys(summary)

  coverage.forEach((arg) => {
    keys.forEach((key) => {
      summary[key].found += arg[key].found
      summary[key].hit += arg[key].hit
    })
  })

  return Math.round(keys.reduce((avg, key) => {
    const found = summary[key].found
    return avg + (found > 0 ? summary[key].hit / found * 100 : 100)
  }, 0) / keys.length * 100) / 100
}
