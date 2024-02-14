import {TParseOpts, TReference} from './interface.js'

export const stringify = (ref: TReference) => 'configref'

export const parse = (input: string, opts: TParseOpts = {}) => ({})

export const resolve = (ref: TReference) => 'url'
