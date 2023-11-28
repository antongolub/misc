import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { fileURLToPath } from 'node:url'
import {parse, format, merge, collide, sum, badge, badgeJson, LCOV, LcovBadgeOptions} from '../../main/ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')
const input = `
TN:
SF:src/main/ts/constants.ts
FNF:0
FNH:0
DA:1,3
DA:2,3
DA:3,3
LF:3
LH:3
BRF:0
BRH:0
end_of_record
TN:
SF:src/main/ts/index.ts
FN:1,topoconfig
FNF:1
FNH:1
FNDA:1,topoconfig
DA:1,2
LF:1
LH:1
BRDA:1,0,0,1
BRF:1
BRH:1
end_of_record
`

describe('parse()', () => {
  it('parses lcov input', () => {
    assert.deepEqual(parse(input), {
      'src/main/ts/constants.ts': {
        brda: [],
        brf: 0,
        brh: 0,
        da: [
          [1, 3],
          [2, 3],
          [3, 3]
        ],
        fn: [],
        fnda: [],
        fnf: 0,
        fnh: 0,
        lf: 3,
        lh: 3,
        sf: 'src/main/ts/constants.ts',
        tn: ''
      },
      'src/main/ts/index.ts': {
        brda: [
          [1, 0, 0, 1]
        ],
        brf: 1,
        brh: 1,
        da: [
          [1, 2]
        ],
        fn:[
          [1,'topoconfig']
        ],
        fnda:[
          [1,'topoconfig']
        ],
        fnf: 1,
        fnh: 1,
        lf: 1,
        lh: 1,
        sf: 'src/main/ts/index.ts',
        tn: ''
      }
    })
  })
})

describe('format()', () => {
  it('formats lcov output', () => {
    const lcov = parse(input)
    assert.equal(format(lcov).trim(), input.trim())
  })
})

describe('merge()', () => {
  it('joins several lcovs', async () => {
    const input1 = await fs.readFile(path.resolve(fixtures, 'a.info'), 'utf8')
    const input2 = await fs.readFile(path.resolve(fixtures, 'b.info'), 'utf8')
    const input3 = await fs.readFile(path.resolve(fixtures, 'c.info'), 'utf8')
    const lcov1 = parse(input1)
    const lcov2 = parse(input2)
    const lcov3 = parse(input3)
    const merged = merge(lcov1, lcov2)

    // await fs.writeFile('1.txt', JSON.stringify(lcov1, null, 2))
    // await fs.writeFile('2.txt', JSON.stringify(lcov2, null, 2))
    // await fs.writeFile('3.txt', JSON.stringify(lcov3, null, 2))
    // await fs.writeFile('new.txt', JSON.stringify(merge(lcov1, lcov2), null, 2))

    assert.deepEqual(merged['src/main/js/cli.mjs'], lcov3['src/main/js/cli.mjs'])
  })
})

describe('sum()', () => {
  const expected = {
    brf: 1,
    brh: 1,
    fnf: 1,
    fnh: 1,
    lf: 4,
    lh: 4,
    branches: 100,
    functions: 100,
    lines: 100,
    avg: 100,
    max: 100
  }

  it('returns summary for string input', () => {
    const digest = sum(parse(input))
    assert.deepEqual(digest, expected)
  })

  it('returns summary for Lcov input', () => {
    const digest = sum(input)
    assert.deepEqual(digest, expected)
  })

  it('applies prefix filter', () => {
    const digest = sum(input, 'src/main/ts/index.ts')
    assert.deepEqual(digest, {
      avg: 100,
      branches: 100,
      brf: 1,
      brh: 1,
      fnf: 1,
      fnh: 1,
      functions: 100,
      lf: 1,
      lh: 1,
      lines: 100,
      max: 100
    })
  })
})

describe('collide', () => {
  it('aggregates reports by scope (prefixed) blocks', () => {
    const lcov1 = parse(`
TN:
SF:foo/constants.ts
FNF:0
FNH:0
DA:1,3
DA:2,3
DA:3,3
LF:3
LH:3
BRF:0
BRH:0
end_of_record
TN:
SF:foo/index.ts
FNF:1
FNH:1
DA:1,3
DA:2,3
LF:3
LH:3
BRF:1
BRH:1
end_of_record
`)
    const lcov2 = parse(`
TN:
SF:foo/index.ts
FNF:3
FNH:3
DA:1,3
DA:2,3
LF:5
LH:5
BRF:4
BRH:4
end_of_record
`)
    const lcov3 = parse(`
TN:
SF:bar/index.ts
FNF:0
FNH:0
DA:1,3
DA:2,3
LF:2
LH:2
BRF:1
BRH:1
end_of_record
`)
    const lcov4 = collide(lcov1, [lcov2, 'foo/'], lcov3)

    assert.equal(lcov4['foo/index.ts'], lcov2['foo/index.ts'])
    assert.equal(lcov4['foo/constants.ts'], undefined)
    assert.equal(lcov4['bar/index.ts'], lcov3['bar/index.ts'])
  })
})

describe('LCOV', () => {
  it('reexports parse and format', () => {
    assert.equal(LCOV.parse, parse)
    assert.equal(LCOV.stringify, format)
  })
})

describe('badge', () => {
  it('generates default badge', () => {
    assert.equal(badge(input), '[![coverage](https://img.shields.io/badge/coverage-100-brightgreen?style=flat)]()')
  })

  it('generates a badge by custom opts', () => {
    const opts: LcovBadgeOptions = {
      color: 'cyan',
      style: 'flat-square',
      pick: 'avg',
      title: 'cov',
      url: 'https://example.com',
      gaps: []
    }
    assert.equal(badge(input, opts), '[![cov](https://img.shields.io/badge/cov-100-cyan?style=flat-square)](https://example.com)')
  })
})

describe('badgeJson', () => {
  it('returns a json to generate a badge', () => {
    const json = badgeJson(input)
    assert.deepEqual(json, {
      color: 'brightgreen',
      label: 'coverage',
      message: '100',
      schemaVersion: 1,
      style: 'flat',
      url: ''
    })
  })
})
