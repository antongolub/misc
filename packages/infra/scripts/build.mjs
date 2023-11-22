#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import esbuild from 'esbuild'
import { nodeExternalsPlugin } from 'esbuild-node-externals'
import minimist from 'minimist'
import glob from 'fast-glob'

const { entry, external, bundle, minify, sourcemap, license, format, map } = minimist(process.argv.slice(2), {
  default: {
    entry: './src/main/ts/index.ts',
    external: 'node:*',
    bundle: 'src', // 'all' | 'none'
    license: 'eof',
    minify: false,
    sourcemap: false,
    format: 'cjs,esm'
  },
  boolean: ['minify', 'sourcemap'],
  string: ['entry', 'external', 'bundle', 'license', 'format', 'map']
})

const mappings = map ? Object.fromEntries(map.split(',').map(v => v.split(':'))) : {}

const entryPoints = entry.includes('*')
  ? await glob(entry.split(':'), { absolute: false, onlyFiles: true })
  : entry.split(':')

const plugins = bundle === 'all'
  ? []
  : [nodeExternalsPlugin()] // https://github.com/evanw/esbuild/issues/619
const _bundle = bundle !== 'none' && !process.argv.includes('--no-bundle')
const _external = _bundle
  ? external.split(',')
  : undefined  // https://github.com/evanw/esbuild/issues/1466

const formats = format.split(',')

const esmConfig = {
  entryPoints,
  outdir: './target/esm',
  bundle: _bundle,
  external: _external,
  minify,
  sourcemap,
  sourcesContent: false,
  platform: 'node',
  target: 'esnext',
  format: 'esm',
  outExtension: {
    '.js': '.mjs'
  },
  plugins,
  legalComments: license,
  tsconfig: './tsconfig.json',
}

const cjsConfig = {
  ...esmConfig,
  outdir: './target/cjs',
  target: 'es6',
  format: 'cjs',
  outExtension: {
    '.js': '.cjs'
  }
}

for (const format of formats) {
  const config = format === 'cjs' ? cjsConfig : esmConfig

  await esbuild
    .build(config)
    .catch(() => process.exit(1))
  await patchOutputs(config)
}

async function patchOutputs (config) {
  for (const entry of config.entryPoints) {
    const ext = config.outExtension['.js']
    const filename = path.resolve(config.outdir, path.basename(entry).replace('.ts', ext))
    const contents = await fs.readFile(filename, 'utf-8')
    const _contents = fixModuleReferences(contents, ext)
    await fs.writeFile(filename, _contents)
  }
}

function fixModuleReferences (contents, ext = '.js',) {
  return contents.replace(
    /((?:\s|^)import\s+|\s+from\s+|\W(?:import|require)\s*\()(["'])([^"']+\/[^"']+|\.{1,2})\/?(["'])/g,
    (_matched, control, q1, from, q2) =>
      `${control}${q1}${from.startsWith('.') ? (mappings[from] || from) + ext : from}${q2}`,
  )
}
