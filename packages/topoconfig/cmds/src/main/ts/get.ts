// https://github.com/you-dont-need/You-Dont-Need-Lodash-Underscore#_get
export const get = <T = any>(obj: any, path: string, defaultValue?: any): T => {
  if (!path || path === '.') return obj
  if (path.startsWith('.')) return get(obj, path.slice(1), defaultValue)

  const travel = (regexp: RegExp) =>
    path.split(regexp)
      .filter(Boolean)
      .reduce((res, key) => (res !== null && res !== undefined ? res[key] : res), obj)
  const result = travel(/[,[\]]+?/) || travel(/[,.[\]]+?/)
  return result === undefined || result === obj ? defaultValue : result
}
