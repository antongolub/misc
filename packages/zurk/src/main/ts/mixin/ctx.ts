import { TMixinHandler } from '../interface.js'

export const ctxMixin: TMixinHandler = (result, $, ctx) =>
  result._ctx
    ? result
    : Object.defineProperty(result, '_ctx', { value: ctx, enumerable: false })
