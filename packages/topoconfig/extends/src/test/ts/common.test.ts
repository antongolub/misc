import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { parseOpts } from '../../main/ts/common.ts'

describe('common', () => {
  it('parseOpts() detects Rules and PopulateOpts', () => {
    assert.deepEqual(
      parseOpts({foo: 'merge', bar: 'override'}),
      {rules: {foo: 'merge', bar: 'override'}}
    )
    assert.deepEqual(
      parseOpts({rules: {foo: 'merge', bar: 'override'}}),
      {rules: {foo: 'merge', bar: 'override'}}
    )
    assert.deepEqual(
      parseOpts({merge: {foo: 'merge', bar: 'override'}}),
      {merge: {foo: 'merge', bar: 'override'}}
    )
  })
})
