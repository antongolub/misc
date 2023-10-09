// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_get
export const get = <T = any>(obj: any, path?: string, defaultValue?: any): T => {
  if (!path) return obj
  if (path.startsWith('.')) return get(obj, path.slice(1), defaultValue)

  const travel = (regexp: RegExp) =>
    path.split(regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj)
  const result = travel(/[,[\]]+?/) || travel(/[,[\].]+?/)
  return result === undefined || result === obj ? defaultValue : result
}

type TPrimitive = null | boolean | string | number | undefined | symbol

// https://stackoverflow.com/a/61602592/13894191
export const flatten = (obj: any, roots: string[] = [], sep = '.'): Record<string, TPrimitive> => Object
  .entries(obj)
  .reduce((memo, [k, v]) => Object.assign(
    memo,
    Array.isArray(v) || Object.prototype.toString.call(v) === '[object Object]'
      ? flatten(v, [...roots, k], sep)
      : {[[...roots, k].join(sep)]: v}
  ), {})

export const expand = (obj: Record<string, TPrimitive>, sep = '.') => Object
  .entries(obj)
  .reduce((m, [k, v]) => {
    let root: any
    k.split(sep).reduce<any>((_m, r, i, a) => {
      const parent: any = _m || (/^\d+$/.test(r) ? [] : {})
      const value = a.length === i + 1
        ? v
        : parent[r] || (/\d+/.test(a[i + 1]) ? [] : {})

      parent[r] = value
      if (!root) {
        root = root || parent
      }

      return value
    }, m)

    return m || root
  }, null)

export type TPromiseAction<T = any> = (value: T | PromiseLike<T>) => void

export type TPromiseInverted<T = any> = {
  promise: Promise<T>,
  resolve: TPromiseAction<T>,
  reject: TPromiseAction<T>
}

export const getPromise = <T = any>(): TPromiseInverted<T> => {
  let resolve: TPromiseAction<T> = () => {}
  let reject: TPromiseAction<T> = () => {}
  const promise = new Promise<T>((...args) => { [resolve, reject] = args })

  return {
    reject,
    resolve,
    promise
  }
}

export const reverseMap = (map: Record<string, string>): Record<string, string> =>
  Object.fromEntries(Object.entries(map).map(entry => entry.reverse()))
