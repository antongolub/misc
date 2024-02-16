import util from 'node:util'
import {TPrepare, TPrepareCtx, TPrepareOpts, TVmap} from './interface.js'

export const isString = (value: any): value is string => typeof value === 'string'

// eslint-disable-next-line @typescript-eslint/ban-types
export const isFn = (value: any): value is Function => typeof value === 'function'

export const isObject = (value: any) => value !== null && typeof value === 'object'

export const isCloneable = (value: any) =>
  isObject(value) &&
  !util.types.isProxy(value) &&
  !isFn(value) &&
  ![RegExp, Date, Promise, Map, Set, WeakMap, WeakSet].some(c => value instanceof c)

export const stripBom = (content: string): string =>
  content.codePointAt(0) === 0xfe_ff
    ? content.slice(1)
    : content

export const pipe = (value: any, hook: (value: any) => any) =>
  isFn(value?.then)
    ? value.then(hook)
    : hook(value)

export const getSeed = (value: any) => isCloneable(value)
  ? Array.isArray(value) ? [] : Object.create(Object.getPrototypeOf(value))
  : undefined

export const getProps = (value: any) => [
  ...(Array.isArray(value) ? Object.keys : Object.getOwnPropertyNames)(value),
  ...Object.getOwnPropertySymbols(value)
]

export const match = (input: string, pattern: string) => {
  if (pattern === input || pattern === '*') return true
  if (pattern[0] === '^') return new RegExp(pattern).test(input)
  if (pattern.includes('*') || pattern.includes('?')) {
    return new RegExp('^' + pattern
      .replaceAll('.', '\\.')
      .replaceAll('?', '.')
      .replaceAll('**', '.+')
      .replaceAll('*', '[^.]+')
    + '$').test(input)
  }

  return false
}

export const unsetKeys = (v: any, keys: string[]) => {
  for (const key of keys) {
    delete v?.[key]
  }
  return v
}
