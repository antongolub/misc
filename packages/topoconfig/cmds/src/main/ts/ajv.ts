import * as _ajv from 'ajv'
import { createRequire } from 'node:module'

const Ajv = _ajv?.default ?? _ajv
const DEFAULT_OPTS = {}
const ajvStack: Record<string, any> = {}
const require = global.require || createRequire(import.meta.url)
const addAjvFormats = require('ajv-formats') // Smth goes wrong with ajv typings and TS 5.3
const getAjv = (opts: Record<string, any>): Record<string, any> => {
  const key = JSON.stringify(opts)

  if (!ajvStack[key]) {
    ajvStack[key] = new (Ajv as any)(opts)
    addAjvFormats(ajvStack[key])
  }

  return ajvStack[key]
}

export const validate = (data: any, schema?: Record<string, any>, opts: Record<string, any> = DEFAULT_OPTS): any => {
  const _ajv = getAjv(opts)

  if (!schema) {
    throw new Error('ajv: schema MUST be specified')
  }

  if (!_ajv.validate(schema, data)) {
    throw new Error(`ajv: ${_ajv.errorsText()}`)
  }

  return data
}

export const ajv = validate
