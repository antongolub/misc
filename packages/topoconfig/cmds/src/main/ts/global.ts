const GLOBAL: any = (function(this: any) { return this?.globalThis || global || this || Function('return this')() })()

export const g = () => GLOBAL
