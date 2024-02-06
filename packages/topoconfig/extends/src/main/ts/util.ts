export const isString = (value: any): value is string => typeof value === 'string'

export const isFn = (value: any): boolean => typeof value === 'function'

export const isObject = (value: any) => typeof value === 'object' && value !== null

export const pipe = (value: any, hook: (value: any) => any) =>
  isFn(value?.then)
    ? value.then(hook)
    : hook(value)

const getSeed = (value: any) => isObject(value) && !isFn(value)
  ? Object?.setPrototypeOf(Array.isArray(value) ? [] : {}, Object?.getPrototypeOf(value))
  : undefined

export const clone = <T = any>(value: T, map = new Map(), seed = getSeed(value)): T => seed
  ? Object.entries(value as any).reduce((m: any, [k, v]) => {
    if (map.has(v)) {
      m[k] = map.get(v)
    } else {
      const _seed = getSeed(v)
      if (_seed) {
        map.set(v, _seed)
        clone(v, map, _seed)
        m[k] = _seed
      } else {
        m[k] = v
      }
    }

    return m
  }, seed)
  : value