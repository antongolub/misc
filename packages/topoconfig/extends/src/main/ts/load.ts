import {createRequire} from 'node:module'
import path from 'node:path'
import fs from 'node:fs'
import {Ctx} from './interface.js'
import {isString, pipe, stripBom} from './util.js'
import {dextend} from './extend.js'

const _require = import.meta.url ? createRequire(import.meta.url) : require
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
    ? dedefault(await import(id))
    : stripBom(await fs.promises.readFile(id, 'utf8'))
}

export const resolve = (id: string, cwd: string): string =>
  id.startsWith('.') || path.extname(id)
    ? path.resolve(cwd, id)
    : id

const dedefault = (value: any) => value?.default ?? value

export const loadResource = (ctx: Ctx) => {
  const {config, cwd, cache} = ctx
  const resource = isString(config)
    ? path.join(cwd, config)
    : config

  if (!cache.has(resource)) {
    const value = processResource(ctx)

    cache.set(resource, value)
    return value
  }

  return pipe(cache.get(resource), dextend)
}

const processResource = (ctx: Ctx) => {
  const {load, config, cwd, parse,  clone, resolve} = ctx

  return pipe(isString(config)
    ? pipe(pipe(
        resolve(config, cwd),
        (resolved) => load(resolved, config, cwd)),
      (v: any) => isString(v) ? parse(config, v) : v)
    : config, clone)
}
