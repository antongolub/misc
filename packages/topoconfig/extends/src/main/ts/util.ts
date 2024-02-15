import util from 'node:util'
import {TClone, TCloneCtx, TCloneOpts, TVmap} from './interface.js'

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

export const clone: TClone = <T = any>(value: T, {vmap, cwd, root, id}: TCloneOpts<T> = {}): T =>
  _clone<T>({value, cwd, vmap, root, id})

const _vmap: TVmap = ({value}) => value

export const vmap = _vmap

export const _clone = <T = any>({
  value,
  memo =      new Map(),
  seed =      getSeed(value),
  vmap =      _vmap,
  prefix =    '',
  resource =  value,
  cwd =       process.cwd(),
  root =      cwd,
  id
}: TCloneCtx<T>): T => seed
  ? getProps(value).reduce((m: any, k) => {
    const p = `${prefix}${k.toString()}`
    const v = vmap({
      value: (value as any)[k],
      key: k,
      prefix: p,
      resource,
      id,
      cwd,
      root
    })
    if (memo.has(v)) {
      m[k] = memo.get(v)
    } else {
      const _seed = getSeed(v)
      if (_seed) {
        memo.set(v, _seed)
        _clone({value: v, memo, seed: _seed, vmap, prefix: `${p}.`, resource, cwd, id})
        m[k] = _seed
      } else {
        m[k] = v
      }
    }

    return m
  }, seed)
  : value
