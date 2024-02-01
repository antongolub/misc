import {createRequire} from 'node:module'
import path from 'node:path'

const _require = import.meta.url ? createRequire(import.meta.url) : require

export const loadSync = (id: string, cwd: string) =>
  _require(path.resolve(cwd, id))

export const load = async (id: string, cwd: string) => {
  const abspath = path.resolve(cwd, id)

  return (id.endsWith('.json')
      ? (await import(abspath, {assert: {type: 'json'}}))
      : (await import(abspath))
  )?.default
}