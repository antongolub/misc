import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { parse, stringify, resolve } from '../../main/ts'
import {TReference} from "../../main/ts/interface";

describe('parse()', () => {
  const cases: [string, TReference | Error][] = [
    [
      'github>qiwi/.github',
      {
        file: 'config.json',
        kind: 'github',
        repo: {
          owner: 'qiwi',
          name: '.github',
        },
        rev: 'main'
      }
    ],
    [
      'github>owner/repo:foo/bar.yaml#v1.0.0',
      {
        file: 'foo/bar.yaml',
        kind: 'github',
        repo: {
          owner: 'owner',
          name: 'repo'
        },
        rev: 'v1.0.0'
      }
    ],
    [
      'unknown>owner/repo',
      new Error('unsupported ref: unknown>owner/repo')
    ]
  ]

  for (const [input, expected] of cases) {
    it(input, () =>
      expected instanceof Error
        ? assert.throws(() => parse(input))
        : assert.deepEqual(parse(input), expected)
    )
  }
})

describe('stringify()', () => {
  const cases: [TReference, string | Error][] = [
    [
      {
        file: 'config.json',
        kind: 'github',
        repo: {
          owner: 'qiwi',
          name: '.github',
        },
        rev: 'main'
      },
      'github>qiwi/.github:config.json#main'
    ],
    [
      {
        file: 'foo/bar.yaml',
        kind: 'github',
        repo: {
          owner: 'owner',
          name: 'repo'
        },
        rev: 'v1.0.0'
      },
      'github>owner/repo:foo/bar.yaml#v1.0.0',
    ],
    [
      {
        file: 'foo/bar.yaml',
        kind: 'unknown' as any,
        repo: {
          owner: 'owner',
          name: 'repo'
        },
        rev: 'v1.0.0'
      },
      new Error('unsupported kind: unknown')
    ]
  ]

  for (const [ref, result] of cases) {
    it((result as any)?.message || result, () => result instanceof Error
      ? assert.throws(() => stringify(ref))
      : assert.deepEqual(stringify(ref), result))
  }
})

describe('resolve()', () => {
  const cases: [TReference | string, string | Error][] = [
    [
      {
        file: 'config.json',
        kind: 'github',
        repo: {
          owner: 'qiwi',
          name: '.github',
        },
        rev: 'main'
      },
      'https://raw.githubusercontent.com/qiwi/.github/main/config.json'
    ],
    [
      {
        file: 'foo/bar.yaml',
        kind: 'github',
        repo: {
          owner: 'owner',
          name: 'repo'
        },
        rev: 'v1.0.0'
      },
      'https://raw.githubusercontent.com/owner/repo/v1.0.0/foo/bar.yaml',
    ],
    [
      'unknown>owner/repo',
      new Error('unsupported kind: unknown')
    ],
    [
      {
        file: 'foo/bar.yaml',
        kind: 'unknown' as any,
        repo: {
          owner: 'owner',
          name: 'repo'
        },
        rev: 'v1.0.0'
      },
      new Error('unsupported kind: unknown')
    ]
  ]

  for (const [ref, result] of cases) {
    it((result as any)?.message || result, () => result instanceof Error
      ? assert.throws(() => resolve(ref))
      : assert.deepEqual(resolve(ref), result))
  }
})
