export const isString = (value: any): value is string => typeof value === 'string'

export const isObject = (value: any) => typeof value === 'object' && value !== null

export const pipe = (value: any, hook: (value: any) => any) =>
  typeof value?.then === 'function'
    ? value.then(hook)
    : hook(value)
