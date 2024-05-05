import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {
  getFilesList,
  getOutputFiles,
  readFile,
  readFiles,
  transformFile,
  writeFile,
  writeFiles,
  renderList,
  resolveEntryPointsPaths,
  parseContentsLayout
} from '../../main/ts'

describe('utils', () => {
  it('has proper exports', () => {
    assert.ok(getFilesList)
    assert.ok(getOutputFiles)
    assert.ok(readFile)
    assert.ok(readFiles)
    assert.ok(transformFile)
    assert.ok(writeFile)
    assert.ok(writeFiles)
    assert.ok(renderList)
    assert.ok(resolveEntryPointsPaths)
    assert.ok(parseContentsLayout)
  })
})
