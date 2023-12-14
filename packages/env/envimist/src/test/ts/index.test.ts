import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import * as process from 'node:process'
import _envimist, { envimist } from '../../main/ts'

describe('envimist()', () => {
  it('provides default export', () => {
    assert.equal(_envimist, envimist)
  })

  it('parses vars with default preset', () => {
    process.env.FOO = 'bar'
    const envs = envimist()
    assert.equal(envs.foo, 'bar')
  })

  it('accepts custom env map and perser options', () => {
    const env = {
      FOO: 'false',
      BAR: undefined,
    }
    const opts = {
      boolean: ['foo']
    }
    const envs = envimist(env, opts)
    assert.equal(envs.foo, false)
    assert.equal(envs.bar, undefined)
  })
})
