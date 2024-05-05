import * as assert from 'node:assert'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'

import { readFiles, getFilesList, getOutputFiles, transformFile, writeFiles, TTransformHook } from '../../main/ts/utils'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')
const temp = path.resolve(__dirname, '../temp')

describe('utils', () => {
  it('getFilesList() returns dir contents', async () => {
    const files = await getFilesList(fixtures)
    assert.deepEqual(files.map(f => path.basename(f)).sort(), ['a.ts', 'b.ts', 'c.ts', 'index.ts'])
  })

  it('readFiles() returns files contents', async () => {
    const entries = await readFiles(fixtures)
    assert.equal(entries.length, 4)
    assert.deepEqual(entries[0], {
      path: path.resolve(fixtures, 'a.ts'),
      contents: 'export const a = \'a\'\n',
    })
  })

  it('getOutputFiles() returns files contents', async () => {
    const entries = await getOutputFiles(undefined, fixtures)
    assert.equal(entries.length, 4)
    assert.deepEqual(entries[0], {
      path: path.resolve(fixtures, 'a.ts'),
      contents: 'export const a = \'a\'\n',
    })
  })

  it('transformFile() applies hooks to file entry', async () => {
    const file = {
      contents: 'const foo = "foo"',
      path: 'index.ts',
    }
    const hooks: TTransformHook[] = [{
      pattern: /index/,
      on: 'load',
      transform: c => c.replace(/foo/g, 'bar'),
    }, {
      pattern: /index/,
      on: 'load',
      rename() { return 'index.js' },
    }]

    const result = await transformFile(file, hooks)
    assert.deepEqual(result, {
      contents: 'const bar = "bar"',
      path: path.resolve(process.cwd(), 'index.js'),
    })
  })

  it('writeFiles() stores file entries to disk', async () => {
    const entries = [
      { path: path.join(temp, 'a.ts'), contents: 'export const a = \'a\'' },
      { path: path.join(temp, 'b.ts'), contents: 'export const b = \'b\'' },
    ]

    await writeFiles(entries)
    const a = await fs.readFile(path.join(temp, 'a.ts'), 'utf8')
    assert.equal(a, 'export const a = \'a\'')
  })
})
