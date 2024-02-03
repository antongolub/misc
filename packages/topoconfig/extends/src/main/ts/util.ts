export const isString = (value: any): value is string => typeof value === 'string'

export const isObject = (value: any) => typeof value === 'object' && value !== null
