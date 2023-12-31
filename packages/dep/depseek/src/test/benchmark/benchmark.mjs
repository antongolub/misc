import Benchmark from 'benchmark'
import { depseek } from '../../../target/esm/index.mjs'
import { parseDeps } from './zx-deps.mjs'
import { getDeps } from './esprima.mjs'

const suite = new Benchmark.Suite
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

// add tests
suite
  .add('depseek', {
    defer: true,
    fn: async (deferred) => {
      await depseek(input)
      deferred.resolve()
    }
  })
  .add('zx-parse-deps', {
    defer: true,
    fn: async (deferred) => {
      await parseDeps(input)
      deferred.resolve()
    }
  })
  .add('esprima', {
    defer: true,
    fn: async(deferred) =>{
      await getDeps(input)
      deferred.resolve()
    }
  })
  .on('cycle', (event) => {
    console.log(String(event.target))
  })
  .on('complete', function () {
    const fastest = this.filter('fastest').map('name')
    console.log('The fastest is ' + fastest)
  })
  .run({ 'async': true })
