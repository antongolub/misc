import util from 'node:util'
import {TPrepare, TPrepareCtx, TPrepareOpts, TVmap} from './interface.js'

export const isString = (value: any): value is string => typeof value === 'string'

export const isFn = (value: any): boolean => typeof value === 'function'

export const isObject = (value: any) => value !== null && typeof value === 'object'

export const isCloneable = (value: any) => isObject(value) && !util.types.isProxy(value) && !isFn(value) && ![RegExp, Date, Promise, Map, Set, WeakMap, WeakSet].some(c => value instanceof c)

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

export const getProps = (value: any) => [...Object.getOwnPropertyNames(value), ...Object.getOwnPropertySymbols(value)]
