import {Duplex} from 'node:stream'

export type TDepshotEntry = {
  raw:      string
  line:     number
  pos:      number
  resolved: string
}

export type TDepshot = Record<string, TDepshotEntry[]>

// https://stackoverflow.com/questions/45891242/how-to-pass-a-buffer-as-argument-of-fs-createreadstream
// https://stackoverflow.com/questions/30096691/read-a-file-one-character-at-a-time-in-node-js
// https://stackoverflow.com/questions/12755997/how-to-create-streams-from-string-in-node-js


const REQUIRE = 'require('
const IMPORT_A = 'import('
const IMPORT_S = 'import '
const FROM = ' from '
// const CMDS = [REQUIRE, IMPORT_A, IMPORT_S, FROM]

export const read = (stream: Duplex) => new Promise((resolve, reject) => {
  {
    stream
      .on('readable', () => {
        let prev = ''
        let chunk
        let c: string | null = null
        let q : string | null = null
        let w = ''
        // let cmd: string = ''

        while (null !== (chunk = stream.read(1) /* here */)) {
          const char: string = chunk.toString('utf8')
          if (c === null && q === null && (char === '"' || char === "'" || char === '`')) {
            q = char
          }

          else if (c === null && q === char && prev !== '\\') {
            q = null
          }

          else if (q === null && c === null && prev === '/' && (char === '/' || char === '*')) {
            c = char
          }

          else if (q === null && c === '/' && char === '\n') {
            c = null
          }

          else if (q === null && c === '*' && prev === '*' && char === '/') {
            c = null
          }

          else if (c === null && q === null) {
            w += char
          }
          prev = char
        }
        resolve(w)
      })
      .on('error', reject)
  }
})

export const depshot = (contents: string, location: string, depshot: TDepshot = {}): TDepshot => {
  const pattern = /((?:\s|^)import\s+|\s+from\s+|\W(?:import|require)\s*\()(["'])([^"']+)(["'])/g
  const lines = contents.split('\n')
  const entries = (depshot[location] = depshot[location] || [])

  for (const l in lines) {
    const line = lines[l]
    const match = pattern.exec(line)
    if (match) {
      const [, offset,, raw] = match
      const { index } = match
      const pos = index + offset.length
      const resolved = raw

      entries.push({
        raw,
        line: Number.parseInt(l),
        pos,
        resolved
      })
    }
  }

  return depshot
}

