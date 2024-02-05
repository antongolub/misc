import {createRequire} from 'node:module'
import path from 'node:path'
import fs from 'node:fs'
import {Ctx} from './interface.js'
import {isString} from './util.js'
import {dextend} from './extend.js'

const _require = import.meta.url ? createRequire(import.meta.url) : require

const exts = new Set(['.js', '.mjs', '.cjs', ''])

export const loadSync = (id: string) =>
  exts.has(path.extname(id))
    ? _require(id)
    : fs.readFileSync(id, 'utf8')

export const load = async (id: string) =>
  exts.has(path.extname(id))
    ? dedefault(await import(id))
    : fs.promises.readFile(id, 'utf8')

export const resolve = (id: string, cwd: string): string =>
  id.startsWith('.') || path.extname(id)
    ? path.resolve(cwd, id)
    : id

const dedefault = (value: any) => value?.default ?? value

export const loadResource = ({load, config, cwd, parse, cache, clone, resolve}: Ctx) => {
  const resource = isString(config)
    ? resolve(config, cwd)
    : config

  if (!cache.has(resource)) {
    const value = pipe(pipe(config, (c: any) => isString(c)
      ? pipe(load(resolve(c, cwd), c, cwd), (v: any) => isString(v) ? parse(c, v) : v)
      : c), clone)

    cache.set(resource, value)
    return value
  }

  return pipe(cache.get(resource), dextend)
}

const pipe = (value: any, hook: (value: any) => any) =>
  typeof value?.then === 'function'
    ? value.then(hook)
    : hook(value)
