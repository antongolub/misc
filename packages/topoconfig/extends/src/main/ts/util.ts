import util from 'node:util'

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

export const clone = <T = any>(value: T, vmap?: CloneCtx<T>['vmap']): T =>
  _clone<T>({value, vmap})

type CloneCtx<T> = {
  value: T
  memo?: Map<any, any>
  seed?: any
  vmap?: (value: any, key: string | symbol, prefix: string, root: any) => any
  prefix?: string
  root?: any
}

export const _clone = <T = any>({
  value,
  memo = new Map(),
  seed = getSeed(value),
  vmap = v => v,
  prefix = '',
  root = value
}: CloneCtx<T>): T => seed
  ? getProps(value).reduce((m: any, k) => {
    const p = `${prefix}${k.toString()}`
    const v = vmap((value as any)[k], k, p, root)
    if (memo.has(v)) {
      m[k] = memo.get(v)
    } else {
      const _seed = getSeed(v)
      if (_seed) {
        memo.set(v, _seed)
        _clone({value: v, memo, seed: _seed, vmap, prefix: `${p}.`, root})
        m[k] = _seed
      } else {
        m[k] = v
      }
    }

    return m
  }, seed)
  : value
