import {Lcov, LcovEntry} from './interface.js'

const EOR = 'end_of_record'

export const parse = (input: string): Lcov => {
  const lcov: Lcov = {}
  const blocks = input.split(EOR).slice(0, -1)

  for (const block of blocks) {
    const entry = parseEntry(block)
    lcov[entry.sf] = entry
  }

  return lcov
}

const parseEntry = (block: string): LcovEntry => {
  const lines = block.trim().split('\n')
  const entry: LcovEntry = {
    tn:     false,
    sf:     '',
    fn:     [],
    fnf:    0,
    fnh:    0,
    fnda:   [],
    da:     [],
    lf:     0,
    lh:     0,
    brda:   [],
    brf:    0,
    brh:    0,
  }
  for (const line of lines) {
    const [key, value] = line.split(':')
    const chunks = value?.split(',') || []

    switch (key) {
      case 'TN':
        entry.tn = true
        break
      case 'SF':
        entry.sf = value
        break
      case 'FN':
        entry.fn.push([+chunks[0], chunks[1]])
        break
      case 'FNF':
        entry.fnf = +value
        break
      case 'FNH':
        entry.fnh = +value
        break
      case 'FNDA':
        entry.fnda.push([+chunks[0], chunks[1]])
        break
      case 'DA':
        entry.da.push([+chunks[0], +chunks[1]])
        break
      case 'LF':
        entry.lf = +value
        break
      case 'LH':
        entry.lh = +value
        break
      case 'BRDA':
        entry.brda.push([+chunks[0], +chunks[1], +chunks[2], +chunks[3]])
        break
      case 'BRF':
        entry.brf = +value
        break
      case 'BRH':
        entry.brh = +value
        break
      default:
        throw new Error(`Unknown LCOV statement: ${key}`)
    }
  }

  return entry
}

const formatEntry = (entry: LcovEntry): string => {
  const {
    tn,
    sf,
    fn,
    fnh,
    fnf,
    fnda,
    da,
    lh,
    lf,
    brda,
    brh,
    brf
  } = entry
  const chunks = [
    tn && 'TN:',
    `SF:${sf}`,
    fn.map(([c0, c1]) => `FN:${c0},${c1}`),
    `FNF:${fnf}`,
    `FNH:${fnh}`,
    fnda.map(([c0, c1]) => `FNDA:${c0},${c1}`),
    da.map(([c0, c1]) => `DA:${c0},${c1}`),
    `LF:${lf}`,
    `LH:${lh}`,
    brda.map(([c0, c1, c2, c3]) => `BRDA:${c0},${c1},${c2},${c3}`),
    `BRF:${brf}`,
    `BRH:${brh}`,
    EOR
  ]
    .filter(Boolean)
    .flat()

  return chunks.join('\n')
}

export const format = (lcov: Lcov): string => Object.values(lcov).map(formatEntry).join('\n')
export const merge = (): undefined => undefined
