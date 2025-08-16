import * as assert from 'node:assert'
import * as fs from 'node:fs'
import * as path from 'node:path'
import {Duplex} from 'node:stream'
import { describe, it } from 'node:test'
import { depseek, depseekSync, fullRe, patchRefs } from '../../main/ts'

const __dirname = new URL('.', import.meta.url).pathname
const fixtures = `${__dirname}/../fixtures`

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
  
  import ( /* webpackChunkName: 'chunk' */ 'optimist')
  require ( /* webpackChunkName: 'chunk' */ 'minimist')
  const cpy = await import('cpy')

  const { pick } = require("lodash") //  @4.17.15
  const { omit } = require  (  
  'underscore'  )
  const fs = require('fs')
  require .    resolve( 'test')
  `

    const stream = new Duplex()
    stream.push(input)
    stream.push(null)

    const chunks = await depseek(stream, { comments: true, re: fullRe })

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
      { type: 'comment', value: " webpackChunkName: 'chunk' ", index: 629 },
      { type: 'dep', value: 'optimist', index: 659 },
      { type: 'comment', value: " webpackChunkName: 'chunk' ", index: 685 },
      { type: 'dep', value: 'minimist', index: 715 },
      { type: 'dep', value: 'cpy', index: 754 },
      { type: 'dep', value: 'lodash', index: 789 },
      { type: 'comment', value: '  @4.17.15', index: 800 },
      { type: 'dep', value: 'underscore', index: 846 },
      { type: 'dep', value: 'fs', index: 883 },
      { type: 'dep', value: 'test', index: 913 }
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
require 'foo'
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

  it('processes large files', () => {
    const contents = fs.readFileSync(path.resolve(fixtures, 'zx-vendor-core-bundle.cjs'), 'utf-8')
    const deps = depseekSync(contents)

/* eslint-disable unicorn/numeric-separators-style */
    assert.deepEqual(deps, [
      { type: 'dep', value: './esblib.cjs', index: 145 },
      { type: 'dep', value: 'fs', index: 444 },
      { type: 'dep', value: 'fs', index: 480 },
      { type: 'dep', value: 'fs', index: 2606 },
      { type: 'dep', value: 'fs', index: 2642 },
      { type: 'dep', value: 'path', index: 6500 },
      { type: 'dep', value: 'process', index: 15226 },
      { type: 'dep', value: 'os', index: 15279 },
      { type: 'dep', value: 'tty', index: 15328 },
      { type: 'dep', value: 'process', index: 24774 },
      { type: 'dep', value: 'fs', index: 24827 },
      { type: 'dep', value: 'os', index: 24868 },
      { type: 'dep', value: 'child_process', index: 29465 },
      { type: 'dep', value: 'process', index: 29530 },
      { type: 'dep', value: 'events', index: 29587 },
      { type: 'dep', value: 'stream', index: 29635 },
      { type: 'dep', value: 'process', index: 29731 },
      { type: 'dep', value: './internals.cjs', index: 43271 },
      { type: 'dep', value: 'fs', index: 43330 },
      { type: 'dep', value: 'fs', index: 43358 },
      { type: 'dep', value: 'path', index: 43411 }
    ])
  })
/* eslint-enable unicorn/numeric-separators-style */

  it('handles escape chars', () => {
/* eslint-disable no-useless-escape */
    const contents = `
const foo = require("./foo.js");
const s1 = "\\"
const s2 = "\""
const bar= require("./bar.js");
const r1 = /[/]/
const r2 = /\//
const r3 = /\\\\'/
const a1 = 1/2/3
const a2 = 1/+/"/
const a3 = 1/require("./a.js")
const baz= require("./baz.js");
`

/* eslint-enable no-useless-escape */
    assert.deepEqual(depseekSync(contents), [
      { type: 'dep', value: './foo.js', index: 22 },
      { type: 'dep', value: './bar.js', index: 84 },
      { type: 'dep', value: './a.js', index: 202 },
      { type: 'dep', value: './baz.js', index: 231 },
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

describe('depseekSync()', () => {
  it('accepts string input', () => {
    assert.deepEqual(depseekSync('import "foo"'), [{index: 8, value: 'foo', type: 'dep'}])
  })

  it('accepts Buffer input', () => {
    assert.deepEqual(depseekSync(Buffer.from('import "foo"')), [{index: 8, value: 'foo', type: 'dep'}])
  })
})
