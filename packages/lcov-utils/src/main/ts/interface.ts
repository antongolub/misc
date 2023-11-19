/**
 * TN:
 * SF:src/main/ts/constants.ts
 * FN:5,E
 * FN:54,U
 * FN:83,z
 * FN:147,H
 * FNF:1
 * FNH:1
 * FNDA:1,topoconfig
 * DA:1,3
 * DA:2,3
 * DA:3,3
 * LF:3
 * LH:3
 * BRDA:5,0,0,50
 * BRDA:8,1,0,98
 * BRDA:9,2,0,74
 * BRF:5
 * BRH:9
 * end_of_record
 */
export type LcovEntry = {
  tn:     string
  sf:     string
  fn:     [number, string][]
  fnf:    number
  fnh:    number
  fnda:   [number, string][]
  da:     [number, number][]
  lf:     number
  lh:     number
  brda:   [number, number, number, number][]
  brf:    number
  brh:    number
}

export type Lcov = Record<string, LcovEntry>
