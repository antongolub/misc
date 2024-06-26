import fs from 'node:fs/promises'
import fss from 'node:fs'
import path from 'node:path'
import {topo} from '@semrel-extra/topo'
import {gitRoot} from '@antongolub/git-root'

const root = await gitRoot()
const ignore = ['esbuild-plugin-utils']
const {packages} = await topo({
  cwd: root,
  filter({manifest}) {
    return !manifest.private && !ignore.includes(manifest.name)
  }})
const readmes = Object.fromEntries((await Promise.all([
    ['root', {relPath: '.'}],
    ...Object.entries(packages)
  ]
  .map(async ([name, {relPath}]) => {
    const ref = path.resolve(root, relPath, 'README.md')
    if (!fss.existsSync(ref)) return
    const contents = await fs.readFile(ref, 'utf8')

    return [name, {ref, contents}]
  }))).filter(Boolean))

// Maybe use this contract instead https://nodejs.org/api/documentation.html#stability-index ?
const getStatus = (md) => {
  const re = /##[^\n]+Status\n([^\n.]+)/i
  switch (((md.match(re) || [])[1] || '').toLowerCase()) {
    case 'blueprint':
    case 'idea':
    case 'b':
      return 'B'

    case 'w':
    case 'wip':
    case 'work in progress':
    case 'working draft':
    case 'public beta':
    case 'beta':
      return 'W'

    case 'c':
    case 'poc':
    case 'concept':
      return 'C'

    case 'r':
    case 'stable':
    case 'production':
    case 'production ready':
    case 'ready':
      return 'R'

    case 'd':
    case 'deprecated':
      return 'D'
    default:
      return ''
  }
}

/**
 * This snippet generates a md table by the package.jsons descriptions
 */
const digest = Object.values(packages)
  .sort(({name: a}, {name: b}) => a.localeCompare(b))
  .reduce((m, {relPath, manifest: {name, description, private: _private}}) => {
    if (!readmes[name]) return m

    const status = getStatus(readmes[name].contents)
    const badge = _private
      ? ''
      : `[![npm (scoped)](https://img.shields.io/npm/v/${name}/latest.svg?label=&color=white)](https://www.npmjs.com/package/${name})` // 09e

    return m + `\n| [${name}](./${relPath}) | ${description} | ${badge} | ${status} |`
  }, '| Package | Description | Latest | Status |\n|---|---|---|---|')

readmes.root.contents = readmes.root.contents.replace(/(## Contents)([\s\S]+)(##)/, (_, pre, __, post) =>
  `${pre}\n${digest}\n\n${post}`
)

await fs.writeFile(readmes.root.ref, readmes.root.contents, 'utf8')
