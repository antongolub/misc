import { Duplex } from 'node:stream'

type TCodeRef = {
  type: string
  value: string
  index: number
}

const OPS = '({}[><=+-*/%&|^!~?:;,'
const FNS = [
  'require(',
  'import('
]
const ISOLATED = [
  'import',
  'from',
  ...FNS
]
const STICKY = [
  '...require(',
  '}from',
  ...[...OPS].flatMap(op => FNS.map(cmd => op + cmd))
]

const ALL = new Set([...ISOLATED, ...STICKY])

const isCmd = (proposal: string) => ALL.has(proposal)
const mayBeCmd = (proposal: string, prev = '', _p = proposal.slice(1)) =>
  ISOLATED.some(cmd => cmd.startsWith(proposal)) && (!prev.trim() || proposal.length > 1) ||
  OPS.includes(proposal[0]) && FNS.some(cmd => cmd.startsWith(_p)) ||
  '...require('.startsWith(proposal) ||
  '}from'.startsWith(proposal)
    ? proposal
    : ''

export const depseek = (stream: Duplex): Promise<TCodeRef[]> => new Promise((resolve, reject) => {

  // https://stackoverflow.com/questions/45891242/how-to-pass-a-buffer-as-argument-of-fs-createreadstream
  // https://stackoverflow.com/questions/30096691/read-a-file-one-character-at-a-time-in-node-js
  // https://stackoverflow.com/questions/12755997/how-to-create-streams-from-string-in-node-js
  stream
    .on('readable', () => {
      const chunks: TCodeRef[] = []

      let i = 0
      let prev = ''
      let chunk
      let c: string | null = null
      let q : string | null = null
      let cmd = ''
      let dep = ''
      let comment = ''

      while (null !== (chunk = stream.read(1000))) {
        const chars = [...chunk.toString('utf8')]
        chars.forEach(char => {
          if (c === q) {
            if (char === '"' || char === "'" || char === '`') {
              q = char
            }
            else if (prev === '/' && (char === '/' || char === '*')) {
              c = char
            }
            else {
              cmd = char === '\n'
                ? ''
                : mayBeCmd(cmd + char.trim(), prev)
            }
          }
          else if (c === null) {
            if (q === char && prev !== '\\') {
              dep && chunks.push({
                type: 'dep',
                value: dep,
                index: i - dep.length
              })
              dep = ''
              cmd = ''
              q = null
            }
            else if (q !== null && isCmd(cmd)) {
              dep += char
              // console.log('dep=', dep)
            }
          }
          else if (q === null) {
            if (c === '/' && char === '\n' || c === '*' && prev === '*' && char === '/') {
              const value = c === '*'
                ? comment.slice(0, -1)
                : comment

              comment && chunks.push({
                type: 'comment',
                value,
                index: i - value.length
              })
              comment = ''
              cmd = ''
              c = null
            }
            else {
              comment += char
            }
          }

          prev = char
          i++
        })
      }
      resolve(chunks)
    })
    .on('error', reject)
})
