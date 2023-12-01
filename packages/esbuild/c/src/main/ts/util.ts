export const asArray = <T extends any>(value: T): Array<T extends Array<any> ? T[number] : T> =>
  (Array.isArray(value) ? value : [value]) as any
