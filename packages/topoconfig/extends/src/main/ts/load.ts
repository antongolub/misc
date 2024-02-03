import {createRequire} from 'node:module'
import path from 'node:path'
import fs from 'node:fs'
import {Ctx} from './interface.js'
import {isString} from './util.js'
import {dextend} from './extend.js'

const _require = import.meta.url ? createRequire(import.meta.url) : require

const exts = new Set(['.js', '.mjs', '.cjs', ''])

export const loadSync = (id: string, cwd: string) => {
  const abspath = path.resolve(cwd, id)
  return exts.has(path.extname(id))
    ? _require(abspath)
    : fs.readFileSync(abspath, 'utf8')
}

export const load = async (id: string, cwd: string) => {
  const abspath = path.resolve(cwd, id)

  return exts.has(path.extname(id))
    ? (await import(abspath))?.default
    : fs.promises.readFile(abspath, 'utf8')
}

export const loadResource = ({load, config, cwd, parse, cache}: Ctx) => {
  const key = isString(config)
    ? path.resolve(cwd, config)
    : config

  if (!cache.has(key)) {
    const value = pipe(config, (c: any) => isString(c)
      ? pipe(load(c, cwd), (v: any) => isString(v) ? parse(c, v) : v)
      : c)
    cache.set(key, value)
    return value
  }

  return pipe(cache.get(key), dextend)
}

const pipe = (value: any, hook: (value: any) => any) =>
  typeof value?.then === 'function'
    ? value.then(hook)
    : hook(value)
