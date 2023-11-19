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
        entry.brda.push([+chunks[0], +chunks[1], +chunks[2], chunks[3] === '-' ? 0 : +chunks[3]])
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
    brda.map(([c0, c1, c2, c3]) => `BRDA:${c0},${c1},${c2},${c3 === 0 ? '-' : c3}`),
    `BRF:${brf}`,
    `BRH:${brh}`,
    EOR
  ]
    .filter(Boolean)
    .flat()

  return chunks.join('\n')
}

export const format = (lcov: Lcov): string => Object.values(lcov).map(formatEntry).join('\n')

const mergeHits = (entries: LcovEntry[]) => {
  const hits: Record<string, number> = {}

  for (const entry of entries) {
    for (const [line, name] of entry.fn) {
      hits[`fn,${line},${name}`] = 1
    }
    for (const [line, count] of entry.da) {
      hits[`da,${line}`] = Math.max(hits[`da,${line}`] || 0, count)
    }
    for (const [count, name] of entry.fnda) {
      hits[`fnda,${name}`] = Math.max(hits[`fnda,${name}`] || 0, count)
    }
    for (const [line, blnum, brnum, count] of entry.brda) {
      const key = `brda,${line},${blnum},${brnum}`
      hits[key] = Math.max(hits[key] || 0, count)
    }
  }

  return hits
}

export const merge = (...lcovs: Lcov[]): Lcov => {
  const sources = lcovs.reduce<Record<string, LcovEntry[]>>((m, lcov) => {
    const entries = Object.values(lcov)

    for (const entry of entries) {
      const {sf} = entry
      if (!m[sf]) {
        m[sf] = []
      }
      m[sf].push(entry)
    }

    return m
  }, {})

  return Object.values(sources).reduce<Lcov>((m, entries) => {
    const hits = mergeHits(entries)
    const first = entries[0]

    let brf = 0
    let brh = 0
    let fnf = 0
    let fnh = 0
    let lf = 0
    let lh = 0
    const da: LcovEntry['da'] = []
    const brda: LcovEntry['brda'] = []
    const fnda: LcovEntry['fnda'] = []
    const fn: LcovEntry['fn'] = []

    for (const [key, count] of Object.entries(hits)) {
      const [name, ...rest] = key.split(',')

      switch(name) {
        case 'fn':
          fn.push([+rest[0], rest[1]])
          break

        case 'fnda':
          fnda.push([count, rest[0]])
          fnf++
          count && fnh++
          break

        case 'brda':
          brda.push([+rest[0], +rest[1], +rest[2], count])
          brf++
          count && brh++
          break

        case 'da':
          da.push([+rest[0], count])
          lf++
          count && lh++
          break
      }
    }

    const fncount = fn.reduce<Record<string, number>>((m, [count, name]) => {
      m[name] = count
      return m
    }, {})

    // FNDA follows FN order
    fn.sort(([, a], [, b]) => fncount[a] - fncount[b])
    fnda.sort(([, a], [, b]) => fncount[a] - fncount[b])
    da.sort(([a], [b]) => a - b)
    brda.sort(([a], [b]) => a - b)

    m[first.sf] = {
      ...first,
      fn,
      fnda,
      fnf,
      fnh,
      brda,
      brf,
      brh,
      da,
      lf,
      lh,
    }

    return m
  }, {})
}
