import fs from 'node:fs/promises'
import path from 'node:path'
import minimist from 'minimist'

const {cwd, deps, output} = minimist(process.argv.slice(2), {
  default: {
    output: 'import-map.json',
    cwd: process.cwd()
  },
  string: ['cwd', 'deps', 'output']
})

const pkgJson = JSON.parse(await fs.readFile(path.resolve(cwd, 'package.json'), 'utf8'))
const _deps = deps
    ? deps.split(',')
    : ['dependencies', 'devDependencies'].flatMap(scope => Object.keys(pkgJson[scope] || {}))

const importMap = _deps.reduce((m, v) => {
  try {
    m[v] = import.meta.resolve(v)
  } catch (e) {
    console.warn(`${v} module path is not resolved`)
  }

  return m
}, {})

const contents = JSON.stringify({
  imports: importMap
}, null ,2)

await fs.writeFile(path.resolve(cwd, output), contents)
