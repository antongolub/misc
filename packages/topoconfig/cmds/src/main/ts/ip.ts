import {createRequire} from 'node:module'

// esbuild + esm returns an empty named getter instead of a module
const require = createRequire(import.meta.url)
const _ip = require('ip')

export const ip = _ip.address
