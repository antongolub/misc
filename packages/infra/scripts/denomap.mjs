import fs from 'node:fs/promises'
import path from 'node:path'
const [cwd, refs, output] = process.argv.slice(2)

const importMap = refs.split(',').reduce((m, v) => {
  m[v] = import.meta.resolve(v)
  return m
}, {})

const contents = JSON.stringify({
  imports: importMap
}, null ,2)

console.log('denomap', contents)

if (output) {
  await fs.writeFile(path.resolve(cwd, output), contents)
} else {
  console.log(importMap)
}
