import fs from 'node:fs'
import {createRequire} from 'node:module'
import path from 'node:path'
import process from 'node:process'
import url from 'node:url'

import {TCtx, TLoad, TParse, TResolve, HelperCtx} from './interface.js'
import {isString, pipe, stripBom} from './util.js'
import {unsetExtends} from './extend.js'

const r = import.meta.url ? createRequire(import.meta.url) : require
const _require = (id: string): any => r(normalizeRequirePath(id))
const _import = (id: string) => import.meta.url ? import(normalizeImportPath(id)) : _require(id)
const cjs = new Set(['.cjs', '.cts'])
const anyjs = new Set(['', '.js', '.ts', '.mjs', '.mts', ...cjs])

export const parse: TParse = ({contents}) => JSON.parse(contents)

export const loadSync: TLoad = ({resolved: id}) =>
  !isDotFile(id) && anyjs.has(path.extname(id))
    ? _require(id)
    : stripBom(fs.readFileSync(id, 'utf8'))

export const load: TLoad = async ({resolved: id}) => {
  const ext = path.extname(id)

  // To avoid Deno `--compat` flag.
  if (cjs.has(ext)) return _require(id)

  return !isDotFile(id) && anyjs.has(ext)
    ? unwrapDefault(await _import(id))
    : stripBom(await fs.promises.readFile(id, 'utf8'))
}

export const resolve: TResolve = ({id, cwd, sync}) =>
  id.startsWith('.')
    ? path.resolve(cwd, id)
    : resolveExternalModulePath(id, sync)

export const locateResource = ({cwd, root, id, sync, resolve}: Partial<HelperCtx> & {resolve: TResolve, id: string, sync: boolean}): HelperCtx => {
  const base = path.resolve(process.cwd(), cwd ?? '.')
  const def: HelperCtx = {cwd: base, root: root || base, id, sync}

  if (!isString(id)) return def

  const rawPath = resolve(def)
  const normalizedPath = rawPath.startsWith('file:') ? url.fileURLToPath(rawPath) : rawPath
  const dir = path.dirname(normalizedPath)

  // This happens if the resolver returns smth weird, like resources with a custom protocol.
  // It's ok, let (custom) loader to handle this case.
  if (dir === '.') return def

  return {
    id: './' + path.basename(normalizedPath),
    cwd: dir,
    root: root || dir,
    sync
  }
}

export const loadResource = (ctx: TCtx) => {
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

const processResource = (ctx: TCtx) => {
  const {load, config, cwd, parse, prepare, resolve, vmap, sync, root} = ctx
  const hctx: HelperCtx = {id: config, root, cwd, sync}

  return pipe(isString(config)
    ? pipe(pipe(
        resolve(hctx),
        (resolved) => load({resolved, ...hctx})),
      (contents: any) => isString(contents) ? parse({...hctx, contents, ext: path.extname(config)}) : contents)
    : config, (c) => prepare(c, {...hctx, vmap}))
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

const resolveExternalModulePath = (id: string, sync: boolean): string => {
  const resolver = sync
      ? r.resolve
     // bun import meta resolver is async
     // https://github.com/oven-sh/bun/blob/f88855da4fc30fac90391c079cd9bbf734ef35b2/test/js/bun/resolve/resolve-test.js#L61
      : ((import.meta as any).resolveSync ?? import.meta.resolve)?.bind(import.meta) || r.resolve

  // Deno requires import-map to enable external module refs:
  // https://stackoverflow.com/questions/71071630/deno-relative-path-issue
  // https://stackoverflow.com/questions/74905332/how-to-use-import-map-with-deno
  // https://github.com/denoland/deno/issues/7997
  // https://github.com/denoland/deno/issues/18474

  return id.includes(':') // `file:///` url or abs path on windows (c:\foo\bar)
    ? id
    : resolver(id) ?? id
}

const unwrapDefault = (value: any) => value?.default ?? value

const isDotFile = (id: string): boolean => path.basename(id)[0] === '.'
