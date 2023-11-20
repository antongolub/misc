const GLOBAL: any = (function(this: any) { return this?.globalThis || global || this || new Function('return this')() })()

export const g = () => GLOBAL
