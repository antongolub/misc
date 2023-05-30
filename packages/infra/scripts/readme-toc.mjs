import fs from 'node:fs/promises'
import path from 'node:path'
import {topo} from '@semrel-extra/topo'
import {gitRoot} from '@antongolub/git-root'

const root = await gitRoot()
const {packages} = await topo({cwd: root})
const readmeFile = path.resolve(root, 'README.md')
let readmeContents = await fs.readFile(readmeFile, 'utf8')

/**
 * This snippet generates a md table by the package.jsons descriptions referenced by the root workspace
 */
const digest = Object.values(packages)
  .sort(({name: a}, {name: b}) => a.localeCompare(b))
  .reduce((m, {relPath, manifest: {name, description, private: _private}}) => {
    const badge = _private
      ? ''
      : `[![npm (scoped)](https://img.shields.io/npm/v/${name})](https://www.npmjs.com/package/${name})`

    return m + `\n| [${name}](./${relPath}) | ${description} | ${badge} |`
  }, '| Package | Description | Latest |\n|---------|-------------|--------|')

readmeContents = readmeContents.replace(/(## Contents)([\s\S]+)(##)/, (_, pre, __, post) =>
  `${pre}\n${digest}\n\n${post}`
)

await fs.writeFile(readmeFile, readmeContents, 'utf8')
