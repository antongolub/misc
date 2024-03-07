// https://stackoverflow.com/questions/47423241/replace-fields-types-in-interfaces-to-promises
export type Promisified<T> = {
  [K in keyof T]: T[K] extends (...args: any) => infer R ?
    (...args: Parameters<T[K]>) => Promise<R> :
    Promise<T[K]>;
}

