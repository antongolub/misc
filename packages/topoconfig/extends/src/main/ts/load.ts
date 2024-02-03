import {createRequire} from 'node:module'
import path from 'node:path'
import fs from 'node:fs'
import {Ctx} from './interface.js'

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

export const loadResource = ({load, config, cwd, parse}: Ctx) =>
  pipe(config, (c: any) => typeof c === 'string'
    ? pipe(load(c, cwd), (v: any) => typeof v === 'string' ? parse(c, v) : v)
    : c)

const pipe = (value: any, hook: (value: any) => any) =>
  typeof value?.then === 'function'
    ? value.then(hook)
    : hook(value)