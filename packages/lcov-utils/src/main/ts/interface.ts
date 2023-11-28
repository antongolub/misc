// https://manpages.debian.org/stretch/lcov/geninfo.1.en.html#FILES

export type LcovEntry = {
  tn:     string               // test name
  sf:     string               // source file
  fn:     [number, string][]   // function line and name
  fnf:    number               // functions found
  fnh:    number               // functions hit
  fnda:   [number, string][]   // function exec count and name
  da:     [number, number][]   // line and exec count
  lf:     number               // lines found
  lh:     number               // lines hit
  brda:   [number, number, number, number][]  // branch data: line, block number, branch number, taken
  brf:    number               // branches found
  brh:    number               // branches hit
}

export type Lcov = Record<string, LcovEntry>

export type LcovDigest = {
  lines: number
  branches: number
  functions: number
  max: number
  avg: number
  fnf: number
  fnh: number
  lf: number
  lh: number
  brf: number
  brh: number
}

export type LcovBadgeOptions = {
  style: string
  color: string
  url: string
  title: string
  pick: keyof LcovDigest
  gaps: [number, string][]
}

export type Badge = {
  schemaVersion: 1
  label: string
  message: string
  color: string
  style: string
  url?: string
}

/** Real world example

TN:
SF:src/main/ts/constants.ts
FN:5,E
FN:54,U
FN:83,z
FN:147,H
FNF:1
FNH:1
FNDA:1,topoconfig
DA:1,3
DA:2,3
DA:3,3
LF:3
LH:3
BRDA:5,0,0,50
BRDA:8,1,0,98
BRDA:9,2,0,74
BRF:5
BRH:9
end_of_record

*/
