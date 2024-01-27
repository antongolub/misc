#!/usr/bin/env node

import glob from 'fast-glob'
import { pathToFileURL } from 'node:url'
import process from 'node:process'
import minimist from 'minimist'

const { cwd } = minimist(process.argv.slice(2), {
  default: {
    cwd: process.cwd()
  },
  string: ['cwd']
})

process.chdir(cwd)

const focused = process.argv.slice(3)
const suites = focused.length ? focused : await glob('src/test/**/*.test.{ts,cjs,mjs}', {cwd, absolute: true, onlyFiles: true})

await Promise.all(suites.map(suite => import(pathToFileURL(suite))))
