import { Duplex } from 'node:stream'

export type TDepshotEntry = {
  raw:      string
  index:    number
  resolved: string
}

export type TDepshot = Record<string, TDepshotEntry[]>

type TChunk = {
  type: string
  value: string
  index: number
}

// https://stackoverflow.com/questions/45891242/how-to-pass-a-buffer-as-argument-of-fs-createreadstream
// https://stackoverflow.com/questions/30096691/read-a-file-one-character-at-a-time-in-node-js
// https://stackoverflow.com/questions/12755997/how-to-create-streams-from-string-in-node-js

const REQUIRE = 'require('
const IMPORT_A = 'import('
const IMPORT_S = 'import'
const FROM = 'from'
const CMDS = [REQUIRE, IMPORT_A, IMPORT_S, FROM]

const mayBeCmd = (proposal: string) => CMDS.some(cmd => cmd.startsWith(proposal)) ? proposal : ''
const isCmd = (proposal: string) => CMDS.includes(proposal)

export const read = (stream: Duplex) => new Promise((resolve, reject) => {
  const chunks: TChunk[] = []

  stream
    .on('readable', () => {
      let i = 0
      let prev = ''
      let chunk
      let c: string | null = null
      let q : string | null = null
      let cmd: string = ''
      let dep = ''
      let comment = ''

      while (null !== (chunk = stream.read(1))) {
        const char: string = chunk.toString('utf8')
        if (c === null && q === null && (char === '"' || char === "'" || char === '`')) {
          q = char
        }

        else if (c === null && q === char && prev !== '\\') {
          q = null
          dep && chunks.push({
            type: 'dep',
            value: dep,
            index: i - dep.length
          })
          dep = ''
          cmd = ''
        }

        else if (q === null && c === null && prev === '/' && (char === '/' || char === '*')) {
          c = char
        }

        else if (q === null && (c === '/' && char === '\n' || c === '*' && prev === '*' && char === '/')) {
          const value = c === '*' ? comment.slice(0, -1) : comment
          comment && chunks.push({
            type: 'comment',
            value,
            index: i - value.length
          })
          comment = ''
          c = null
        }

        else if (c === null && q === null && (cmd || !prev.trim())) {
          cmd = mayBeCmd(cmd + char.trim())
        }

        else if (isCmd(cmd) && q !== null && c === null) {
          dep += char
        }
        else if (c !== null && q === null) {
          comment += char
        }

        prev = char
        i++
      }
      resolve(chunks)
    })
    .on('error', reject)
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
        index: Number.parseInt(l),
        resolved
      })
    }
  }

  return depshot
}

