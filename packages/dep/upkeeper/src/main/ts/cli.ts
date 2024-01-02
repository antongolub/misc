#!/usr/bin/env node

import {upkeeper} from './index.ts'
import minimist from 'minimist'
import process from 'node:process'
import fs from 'node:fs/promises'
import path from 'node:path'

const argv = process.argv.slice(2)
const flags = minimist(argv, {
  boolean: ['dryrun', 'combine'],
  string: ['config', 'output', 'cwd', 'granularity']
});

(async () => {
  try {
    const bool = (name: string) => argv.some(v => v.startsWith(`--${name}`)) ? flags[name] : c[name]
    const c = flags.config
      ? flags.config[0] === '{'
        ? JSON.parse(flags.config)
        : JSON.parse(await fs.readFile(path.resolve(flags.cwd || process.cwd(), flags.config), 'utf8'))
      : {}
    const config = {
      ...c,
      ...flags,
      combine: bool('combine'),
      dryrun: bool('dryrun'),
    }

    await upkeeper(config)
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()

