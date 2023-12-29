import { Readable } from 'node:stream'

type TCodeRef = {
  type: string
  value: string
  index: number
}

type TOpts = {
  comments?: boolean
  bufferSize?: number
}

const re = /((\.{3}|\s|[!%&(*+,/:;<=>?[^{|}~-]|^)(require\(|import\(?)|\sfrom)\s*$/
const isDep = (proposal: string) => !!proposal && re.test(proposal)

export const depseek = (stream: Readable, opts: TOpts = {comments: false}): Promise<TCodeRef[]> => new Promise((resolve, reject) => {
  const size = opts.bufferSize || 1000

  // https://nodejs.org/api/stream.html#stream_readable_read_size
  // https://stackoverflow.com/questions/45891242/how-to-pass-a-buffer-as-argument-of-fs-createreadstream
  // https://stackoverflow.com/questions/30096691/read-a-file-one-character-at-a-time-in-node-js
  // https://stackoverflow.com/questions/12755997/how-to-create-streams-from-string-in-node-js
  stream
    .setEncoding('utf8')
    .on('readable', () => {
      const chunks: TCodeRef[] = []
      let i = 0
      let prev = ''
      let chunk: string
      let c: string | null = null
      let q: string | null = null
      let token = ''
      let strLiteral = ''
      let commentBlock = ''
      let commentValue = ''

      const pushChunk = (type: string, value: string, index: number) => chunks.push({ type, value, index })

      while (null !== (chunk = stream.read(size))) {
        const len = chunk.length
        let j = 0

        while (j < len) {
          const char = chunk[j]
          if (c === q) {
            if (char === '\n') token = ''
            else if (char === '"' || char === "'" || char === '`') q = char
            else if (prev === '/' && (char === '/' || char === '*')) c = char
            else token += char
          } else if (c === null) {
            if (q === char && prev !== '\\') {
              if (strLiteral && isDep(token.slice(-15))) pushChunk('dep', strLiteral, i - strLiteral.length)
              strLiteral = ''
              token = ''
              q = null
            } else strLiteral += char
          } else if (q === null) {
            if ((c === '/' && char === '\n') || (c === '*' && prev === '*' && char === '/')) {
              commentValue = c === '*' ? commentBlock.slice(0, -1) : commentBlock
              if (commentValue && opts.comments) pushChunk('comment', commentValue, i - commentValue.length)
              commentBlock = ''
              token = ''
              c = null
            } else commentBlock += char
          }

          prev = char
          i++
          j++
        }
      }

      resolve(chunks)
    })
    .on('error', reject)
})
