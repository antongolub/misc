#!/usr/bin/env node

import {upkeeper} from './index.ts'
import minimist from 'minimist'
import process from 'node:process'
import fs from 'node:fs/promises'
import path from 'node:path'

const flags = minimist(process.argv.slice(2), {
  boolean: ['dryrun', 'combine'],
  string: ['config', 'output', 'cwd']
});

(async () => {
  try {
    const config = flags.config[0] === '{'
      ? JSON.parse(flags.config)
      : JSON.parse(await fs.readFile(path.resolve(flags.cwd || process.cwd(), flags.config), 'utf8'))

    await upkeeper(config)
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()

