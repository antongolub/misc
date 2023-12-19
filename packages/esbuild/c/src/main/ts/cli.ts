#!/usr/bin/env node

import * as process from 'node:process'
import esbuild, {BuildOptions} from 'esbuild'
import { parseArgv, loadConfig } from './index.ts'
import {objectToCamelCase} from './util.ts'

(async () => {
  try {
    const flags = parseArgv(process.argv.slice(2))
    const _config = await loadConfig({
      cwd: process.cwd(),
      searchPlaces: flags.config
    })
    const config = objectToCamelCase({
      ..._config,
      ...flags,
      _: undefined,
      config: undefined
    }) as BuildOptions

    await esbuild.build(config)
    process.exit(0)
  } catch (e) {
    console.error(e)
    process.exit(1)
  }
})()
