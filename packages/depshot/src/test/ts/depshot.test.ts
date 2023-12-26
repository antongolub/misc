import * as assert from 'node:assert'
import * as path from 'node:path'
import * as fs from 'node:fs'
import {Duplex} from 'node:stream'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import {depshot, read, TDepshot} from '../../main/ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('depshot()', () => {
  const cases: [string, string, string, TDepshot][] = [
    [
      'basic require statement',
      `const foo = require('foo')`,
      'index.js',
      {
        'index.js': [{
          index: 0,
          raw: 'foo',
          resolved: 'foo'
        }]
      }
    ]
  ];

  for (const [name, contents, location, expected] of cases) {
    it(name, () => {
      assert.deepEqual(depshot(contents, location), expected)
    })
  }
})

describe('read()', () => {
  it('reads a stream', async () => {
    // const stream = fs.createReadStream(path.join(__dirname, '../fixtures/regular-repo/build', 'index.js'))
    const input = `
import fs from "node:fs"
import 'foo'      // @1.0.0
iimport 'qux'
const bar = require('bar')  /* @2 */
const baz = (await import('baz')).default
`
    const stream = new Duplex()
    stream.push(input)
    stream.push(null)

    const chunks = await read(stream)
    console.log(chunks)
  })
})
