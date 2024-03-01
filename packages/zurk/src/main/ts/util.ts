export const noop = () => { /* noop */ }

export const makeDeferred = <T = any>() => {
  let resolve
  let reject
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej })
  return { resolve, reject, promise }
}

export const isThenable = (value: any): boolean => typeof value?.then === 'function'
