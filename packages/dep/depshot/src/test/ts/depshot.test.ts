import * as assert from 'node:assert'
import * as path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import {depshot, TDepshot} from '../../main/ts'

// const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
