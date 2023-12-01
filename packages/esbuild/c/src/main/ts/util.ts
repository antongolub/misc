export const asArray = <T>(value: T): Array<T extends Array<any> ? T[number] : T> =>
  (Array.isArray(value) ? value : [value]) as any
