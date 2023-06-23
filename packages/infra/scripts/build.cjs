#!/usr/bin/env node

const esbuild = require('esbuild')
const { nodeExternalsPlugin } = require('esbuild-node-externals')

const {argv} = process
const bundle = !argv.includes('--no-bundle')

const esmConfig = {
  entryPoints: ['./src/main/ts/index.ts'],
  outdir: './target/esm',
  bundle,
  minify: true,
  sourcemap: true,
  sourcesContent: false,
  platform: 'node',
  target: 'ES2020',
  format: 'esm',
  outExtension: {
    '.js': '.mjs'
  },
  external: ['node:*'],               // https://github.com/evanw/esbuild/issues/1466
  plugins: [nodeExternalsPlugin()],   // https://github.com/evanw/esbuild/issues/619
  tsconfig: './tsconfig.json'
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

const config = argv.includes('--cjs')
  ? cjsConfig
  : esmConfig

esbuild
  .build(config)
  .catch(() => process.exit(1))
