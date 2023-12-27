import { Duplex } from 'node:stream'

type TCodeRef = {
  type: string
  value: string
  index: number
}

const OPS = [...'({}[><=+-*/%&|^!~?:;,']
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
  ...OPS.flatMap(op => FNS.map(cmd => op + cmd))
]

const isCmd = (proposal: string) => ISOLATED.includes(proposal) || STICKY.includes(proposal)
const mayBeCmd = (proposal: string, prev = '') =>
  ISOLATED.some(cmd => cmd.startsWith(proposal)) && (!prev.trim() || proposal.length > 1) ||
  STICKY.some(cmd => cmd.startsWith(proposal)) ? proposal : ''

export const depseek = (stream: Duplex): Promise<TCodeRef[]> => new Promise((resolve, reject) => {
  const chunks: TCodeRef[] = []

  // https://stackoverflow.com/questions/45891242/how-to-pass-a-buffer-as-argument-of-fs-createreadstream
  // https://stackoverflow.com/questions/30096691/read-a-file-one-character-at-a-time-in-node-js
  // https://stackoverflow.com/questions/12755997/how-to-create-streams-from-string-in-node-js
  stream
    .on('readable', () => {
      let i = 0
      let prev = ''
      let chunk
      let c: string | null = null
      let q : string | null = null
      let cmd = ''
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
          cmd = ''
          c = null
        }

        else if (c === null && q === null) {
          cmd = char === '\n'
            ? ''
            : mayBeCmd(cmd + char.trim(), prev)
          // console.log('cmd=', cmd, 'char=', char)
        }

        else if (isCmd(cmd) && q !== null && c === null) {
          dep += char
          // console.log('dep=', dep)
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
