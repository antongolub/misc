import {createRequire} from 'node:module'
import path from 'node:path'
import fs from 'node:fs'
import url from 'node:url'
import {Ctx} from './interface.js'
import {isString, pipe, stripBom} from './util.js'
import {unsetExtends} from './extend.js'

const r = import.meta.url ? createRequire(import.meta.url) : require
const _require = (id: string): any => r(normalizeRequirePath(id))
const _import = (id: string) => import.meta.url ? import(normalizeImportPath(id)) : _require(id)
const cjs = new Set(['.cjs', '.cts'])
const anyjs = new Set(['', '.js', '.ts', '.mjs', '.mts', ...cjs])

export const loadSync = (id: string) =>
  anyjs.has(path.extname(id))
    ? _require(id)
    : stripBom(fs.readFileSync(id, 'utf8'))

export const load = async (id: string) => {
  const ext = path.extname(id)

  // To avoid Deno `--compat` flag.
  if (cjs.has(ext)) return _require(id)

  return anyjs.has(ext)
    ? unwrapDefault(await _import(id))
    : stripBom(await fs.promises.readFile(id, 'utf8'))
}

export const resolve = (id: string, cwd: string): string =>
  id.startsWith('.') || path.extname(id)
    ? path.resolve(cwd, id)
    : id

export const parse = (name: string, contents: string, ext: string) =>
  ext === '.json' ? JSON.parse(contents) : contents

const unwrapDefault = (value: any) => value?.default ?? value

export const loadResource = (ctx: Ctx) => {
  const {config, cwd, cache, extendKeys} = ctx
  const resource = isString(config)
    ? path.join(cwd, config)
    : config

  if (!cache.has(resource)) {
    const value = processResource(ctx)

    cache.set(resource, value)
    return value
  }

  return pipe(cache.get(resource), v => unsetExtends(v, extendKeys))
}

const processResource = (ctx: Ctx) => {
  const {load, config, cwd, parse,  clone, resolve} = ctx

  return pipe(isString(config)
    ? pipe(pipe(
        resolve(config, cwd),
        (resolved) => load(resolved, config, cwd)),
      (v: any) => isString(v) ? parse(config, v, path.extname(config)) : v)
    : config, clone)
}

// https://stackoverflow.com/questions/69665780/error-err-unsupported-esm-url-scheme-only-file-and-data-urls-are-supported-by
// https://github.com/nodejs/node/issues/31710
// `id.includes(':')` detects abs paths on windows which cannot be processed as is by the import api
const normalizeImportPath = (id: string): string => id.startsWith('file:') || !(id.includes(':'))
  ? id
  : url.pathToFileURL(id).href

const normalizeRequirePath = (id: string): string => id.startsWith('file:')
  ? url.fileURLToPath(id)
  : id
