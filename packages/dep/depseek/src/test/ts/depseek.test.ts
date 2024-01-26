import * as assert from 'node:assert'
import {Duplex} from 'node:stream'
import { describe, it } from 'node:test'
import { depseek, patchRefs } from '../../main/ts'

describe('depseek()', () => {
  it('searches for deps and comments', async () => {
    const input = `
  require('a') // @1.0.0
  const b =require('b') /* @2.0.0 */
  const c = {
    c:require('c') /* @3.0.0 */, 
    d: await import('d') /* @4.0.0 */, 
    ...require('e') /* @5.0.0 */
  }
  const f = [...require('f') /* @6.0.0 */] 
  ;require('g'); // @7.0.0
  const h = 1 *require('h') // @8.0.0
  {require('i') /* @9.0.0 */}
  import 'j' // @10.0.0

  import fs from 'fs'
  import path from 'path'
  import foo from "foo"
  import bar from "bar" /* @1.0.0 */
  import baz from "baz" //    @^2.0
  import qux from "@qux/pkg/entry" //    @^3.0
  import {api as alias} from "qux/entry/index.js" // @^4.0.0-beta.0

  const cpy = await import('cpy')
  const { pick } = require("lodash") //  @4.17.15
  `

    const stream = new Duplex()
    stream.push(input)
    stream.push(null)

    const chunks = await depseek(stream, { comments: true })

    assert.deepEqual(chunks, [
      { type: 'dep', value: 'a', index: 12 },
      { type: 'comment', value: ' @1.0.0', index: 18 },
      { type: 'dep', value: 'b', index: 46 },
      { type: 'comment', value: ' @2.0.0 ', index: 53 },
      { type: 'dep', value: 'c', index: 92 },
      { type: 'comment', value: ' @3.0.0 ', index: 99 },
      { type: 'dep', value: 'd', index: 132 },
      { type: 'comment', value: ' @4.0.0 ', index: 139 },
      { type: 'dep', value: 'e', index: 167 },
      { type: 'comment', value: ' @5.0.0 ', index: 174 },
      { type: 'dep', value: 'f', index: 213 },
      { type: 'comment', value: ' @6.0.0 ', index: 220 },
      { type: 'dep', value: 'g', index: 244 },
      { type: 'comment', value: ' @7.0.0', index: 251 },
      { type: 'dep', value: 'h', index: 283 },
      { type: 'comment', value: ' @8.0.0', index: 289 },
      { type: 'dep', value: 'i', index: 309 },
      { type: 'comment', value: ' @9.0.0 ', index: 316 },
      { type: 'dep', value: 'j', index: 337 },
      { type: 'comment', value: ' @10.0.0', index: 342 },
      { type: 'dep', value: 'fs', index: 370 },
      { type: 'dep', value: 'path', index: 394 },
      { type: 'dep', value: 'foo', index: 419 },
      { type: 'dep', value: 'bar', index: 443 },
      { type: 'comment', value: ' @1.0.0 ', index: 451 },
      { type: 'dep', value: 'baz', index: 480 },
      { type: 'comment', value: '    @^2.0', index: 487 },
      { type: 'dep', value: '@qux/pkg/entry', index: 516 },
      { type: 'comment', value: '    @^3.0', index: 534 },
      { type: 'dep', value: 'qux/entry/index.js', index: 574 },
      { type: 'comment', value: ' @^4.0.0-beta.0', index: 596 },
      { type: 'dep', value: 'cpy', index: 641 },
      { type: 'dep', value: 'lodash', index: 675 },
      { type: 'comment', value: '  @4.17.15', index: 686 }
    ])
  })

  it('handles false positives', async () => {
    // const stream = fs.createReadStream(path.join(__dirname, '../fixtures/regular-repo/build', 'index.js'))
    const input = `
import fs from "node:fs"
import 'foo'      // @1.0.0
iimport 'qux'
const q = await import('q')         // @1.2.3
const l = await _import('l')        // @3.2.1
const br = _require('br')           /* @0 */
const bar = require('bar')          /* @1 */
const baar = {...require('baar')}   /* @2 */
const baaar = rrequire('baaar')     /* @3 */
const baz = (await import('baz')).default
`
    const stream = new Duplex()
    stream.push(input)
    stream.push(null)

    const chunks = await depseek(stream, { comments: true })

    assert.deepEqual(chunks, [
      { type: 'dep', value: 'node:fs', index: 17 },
      { type: 'dep', value: 'foo', index: 34 },
      { type: 'comment', value: ' @1.0.0', index: 46 },
      { type: 'dep', value: 'q', index: 92 },
      { type: 'comment', value: ' @1.2.3', index: 106 },
      { type: 'comment', value: ' @3.2.1', index: 152 },
      { type: 'comment', value: ' @0 ', index: 199 },
      { type: 'dep', value: 'bar', index: 226 },
      { type: 'comment', value: ' @1 ', index: 244 },
      { type: 'dep', value: 'baar', index: 276 },
      { type: 'comment', value: ' @2 ', index: 289 },
      { type: 'comment', value: ' @3 ', index: 334 },
      { type: 'dep', value: 'baz', index: 367 }
    ])
  })

  it('accepts string input', async () => {
    const input = `
import fs from "node:fs"
import 'foo'      // @1.0.0
iimport 'qux'
const q = await import('q')         // @1.2.3
const l = await _import('l')        // @3.2.1
const br = _require('br')           /* @0 */
`
    const chunks = await depseek(input, { comments: true })

    assert.deepEqual(chunks, [
      { type: 'dep', value: 'node:fs', index: 17 },
      { type: 'dep', value: 'foo', index: 34 },
      { type: 'comment', value: ' @1.0.0', index: 46 },
      { type: 'dep', value: 'q', index: 92 },
      { type: 'comment', value: ' @1.2.3', index: 106 },
      { type: 'comment', value: ' @3.2.1', index: 152 },
      { type: 'comment', value: ' @0 ', index: 199 },
    ])
  })
})

describe('patchRefs()', () => {
  it('applies dep patch to code fragment', () => {
    const input = `
import {foo} from './foo'
import {bar} from "./bar"
import {baz} from 'baz'
`
    // eslint-disable-next-line unicorn/consistent-function-scoping
    const patcher = (v: string) => v.startsWith('.') ? v + '.js' : v
    const expected = `
import {foo} from './foo.js'
import {bar} from "./bar.js"
import {baz} from 'baz'
`
    assert.equal(patchRefs(input, patcher), expected)
  })
})
