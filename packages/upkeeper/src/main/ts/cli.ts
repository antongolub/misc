#!/usr/bin/env node

import {upkeeper} from './index.js'
import minimist from 'minimist'
import process from 'node:process'
import fs from 'node:fs/promises'
import path from 'node:path'

const flags = minimist(process.argv.slice(2), {
  boolean: ['dryRun'],
  string: ['cwd', 'target', 'scope', 'ignore', 'match', 'commit', 'output']
});

(async () => {
  try {
    const chunks = await upkeeper(flags)
    const cwd = flags.cwd || process.cwd()
    const script = chunks.join('\n')

    if (flags.output) {
      await fs.writeFile(path.resolve(cwd, flags.output), script, 'utf8')
    } else {
      console.log(script)
    }
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()
