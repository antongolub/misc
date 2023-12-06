#!/usr/bin/env node

import {upkeeper} from './index.js'
import minimist from 'minimist'
import process from 'node:process'

const flags = minimist(process.argv.slice(2), {
  boolean: ['dryRun'],
  string: ['cwd', 'target', 'scope', 'ignore', 'match', 'commit']
});

(async () => {
  try {
    const chunks = await upkeeper(flags)
    const script = chunks.join('\n')

    console.log(script)
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()
