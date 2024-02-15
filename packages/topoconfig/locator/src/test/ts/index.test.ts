import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { parse, stringify, resolve } from '../../main/ts'
import {TParseOpts, TReference, TStringifyOpts} from '../../main/ts/interface'

describe('parse()', () => {
  const cases: [string, TParseOpts | undefined, TReference | Error][] = [
    [
      'github>qiwi/.github',
      undefined,
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
      undefined,
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
      'owner/repo',
      undefined,
      {
        file: 'config.json',
        kind: 'github',
        repo: {
          owner: 'owner',
          name: 'repo'
        },
        rev: 'main'
      }
    ],
    [
      'owner/repo:foo/bar/baz.yaml@beta',
      undefined,
      {
        file: 'foo/bar/baz.yaml',
        kind: 'github',
        repo: {
          owner: 'owner',
          name: 'repo'
        },
        rev: 'beta'
      }
    ],
    [
      'owner/repo',
      {
        defaults: {
          file: 'foo/bar/baz.yaml',
          rev: 'dev'
        }
      },
      {
        file: 'foo/bar/baz.yaml',
        kind: 'github',
        repo: {
          owner: 'owner',
          name: 'repo'
        },
        rev: 'dev'
      }
    ],
    [
      'unknown>owner/repo',
      undefined,
      new Error('unsupported ref: unknown>owner/repo')
    ]
  ]

  for (const [input, opts, expected] of cases) {
    it(input, () =>
      expected instanceof Error
        ? assert.throws(() => parse(input, opts))
        : assert.deepEqual(parse(input, opts), expected)
    )
  }
})

describe('stringify()', () => {
  const cases: [TReference, TStringifyOpts | undefined, string | Error][] = [
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
      undefined,
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
      undefined,
      'github>owner/repo:foo/bar.yaml#v1.0.0',
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
      {format: 'github'},
      'owner/repo:foo/bar.yaml@v1.0.0',
    ],
    [
      {
        file: 'config.json',
        kind: 'github',
        repo: {
          owner: 'owner',
          name: 'repo'
        },
        rev: 'master'
      },
      {format: 'github', omitDefaults: true, defaults: {rev: 'master'}},
      'owner/repo',
    ],
    [
      {
        file: 'foo/bar.yaml',
        kind: 'foo' as any,
        repo: {
          owner: 'owner',
          name: 'repo'
        },
        rev: 'v1.0.0'
      },
      undefined,
      new Error('unsupported kind: foo')
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
      {format: 'bar' as any},
      new Error('unsupported format: bar')
    ]
  ]

  for (const [ref, opts, result] of cases) {
    it((result as any)?.message || result, () => result instanceof Error
      ? assert.throws(() => stringify(ref, opts))
      : assert.deepEqual(stringify(ref, opts), result))
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
