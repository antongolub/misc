#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import url from 'node:url'
import {promisify} from 'node:util'
import minimist from 'minimist'
import {populate} from '@topoconfig/extends'

import {TOptions} from './interface.ts'
import {generateDts} from './index.ts'
import {camelizeRecord} from './util.js'

export const run = async (exit = process.exit, _opts?: any) => {
  try {
    const opts = _opts || await parseArgv()
    const declarations = generateDts(opts)
    const { dryRun, cwd} = opts as any

    if (dryRun) {
      process.stdout.write(JSON.stringify(declarations, null, 2))
      exit(0)
    }

    await Promise.all(Object.entries(declarations).map(([name, contents]) =>
      fs.promises.writeFile(path.resolve(cwd, name), contents)))
    exit(0)
  } catch (e) {
    console.error(e)
    exit(1)
  }
}

export const parseArgv = async (argv = process.argv.slice(2)): Promise<TOptions> => {
  const flags = camelizeRecord(minimist(argv, {
    string: ['tsconfig', 'strategy', 'ext', 'pkg-name', 'entry-points', 'cwd'],
    boolean: ['conceal', 'dry-run'],
  }))
  const { tsconfig = 'tsconfig.json' } = flags
  const { compilerOptions = {} } = (await promisify(fs.exists)(tsconfig))
    ? await populate(JSON.parse(await fs.promises.readFile(tsconfig, 'utf8')), {
      compilerOptions: 'merge',
    })
    : {}

  return {
    ...flags,
    compilerOptions,
  }
}

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url)
  if (process.argv[1] === modulePath) {
    (async () => run())()
  }
}
