import { Readable } from 'node:stream'

type TCodeRef = {
  type: string
  value: string
  index: number
}

const isDep = (proposal: string) => /((\.\.\.|\s|[({}[><=+\-*/%&|^!~?:;,]|^)(require\(|import\(?)|\sfrom)\s*$/.test(proposal)

export const depseek = (stream: Readable): Promise<TCodeRef[]> => new Promise((resolve, reject) => {

  stream.setEncoding('utf8')
  // https://nodejs.org/api/stream.html#stream_readable_read_size
  // https://stackoverflow.com/questions/45891242/how-to-pass-a-buffer-as-argument-of-fs-createreadstream
  // https://stackoverflow.com/questions/30096691/read-a-file-one-character-at-a-time-in-node-js
  // https://stackoverflow.com/questions/12755997/how-to-create-streams-from-string-in-node-js
  stream
    .on('readable', () => {
      const chunks: TCodeRef[] = []

      let i = 0
      let prev = ''
      let chunk: string
      let c: string | null = null
      let q : string | null = null
      let token = ''
      let dep = ''
      let comment = ''

      while (null !== (chunk = stream.read(1000))) {
        chunk.split('').forEach(char => {
          if (c === q) {
            if (char === '\n') {
              token = ''
            }
            else if (char === '"' || char === "'" || char === '`') {
              q = char
            }
            else if (prev === '/' && (char === '/' || char === '*')) {
              c = char
            }
            else {
              token += char
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
              token = ''
              q = null
            }
            else if (q !== null && isDep(token)) {
              dep += char
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
              token = ''
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
