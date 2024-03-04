export const noop = () => { /* noop */ }

export type PromiseResolve<T = any> = (value: T | PromiseLike<T>) => void

export const makeDeferred = <T = any, E = any>(): {promise: Promise<T>, resolve: PromiseResolve<T>, reject: PromiseResolve<E>} => {
  let resolve
  let reject
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { resolve, reject, promise } as any
}

export const isPromiseLike = (value: any): boolean => typeof value?.then === 'function'