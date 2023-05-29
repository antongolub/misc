#!/usr/bin/env node

import glob from 'fast-glob'

const suites = await glob('src/test/**/*.test.{ts,cjs,mjs}', {cwd: process.cwd(), absolute: true, onlyFiles: true})

await Promise.all(suites.map(suite => import(suite)))
