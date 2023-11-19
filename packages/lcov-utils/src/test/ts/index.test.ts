import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { parse, format, merge } from '../../main/ts'

describe('parse()', () => {
  it('parses lcov input', () => {
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
        tn: true
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
        tn: true
      }
    })
  })
})

describe('parse()', () => {
  it('formats lcov output', () => {
    assert.equal(format(), undefined)
  })
})

describe('merge()', () => {
  it('joins several lcovs', () => {
    assert.equal(merge(), undefined)
  })
})

