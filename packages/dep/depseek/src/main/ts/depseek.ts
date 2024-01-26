import { Readable } from 'node:stream'

export type TCodeRef = {
  type: string
  value: string
  index: number
}

export type TOptsNormalized = {
  comments: boolean
  bufferSize: number
}

export type TOpts = Partial<TOptsNormalized>

type TPseudoReadable = { read: (size: number) => string | null }

const re = /((\.{3}|\s|[!%&(*+,/:;<=>?[^{|}~-]|^)(require\(|import\(?)|\sfrom)\s*$/
const isDep = (proposal: string) => !!proposal && re.test(proposal)
const normalizeOpts = (opts?: TOpts): TOptsNormalized => ({
  bufferSize: 1000,
  comments: false,
  ...opts
})

export const depseek = (stream: Readable | string, opts?: TOpts): Promise<TCodeRef[]> => new Promise((resolve, reject) => {
  if (typeof stream === 'string') {
    return resolve(depseekSync(stream, opts))
  }

  // https://nodejs.org/api/stream.html#stream_readable_read_size
  // https://stackoverflow.com/questions/45891242/how-to-pass-a-buffer-as-argument-of-fs-createreadstream
  // https://stackoverflow.com/questions/30096691/read-a-file-one-character-at-a-time-in-node-js
  // https://stackoverflow.com/questions/12755997/how-to-create-streams-from-string-in-node-js
  stream
    .setEncoding('utf8')
    .on('readable', () => {
      resolve(extract(stream, opts))
    })
    .on('error', reject)
})

export const depseekSync = (input: string, opts?: TOpts): TCodeRef[] => extract(readify(input), opts)

export const patchRefs = (contents: string, patcher: (ref: string) => string): string => {
  const deps = depseekSync(contents)
  let pos = 0
  let _contents = ''

  for (const {index, value} of deps) {
    _contents = _contents + contents.slice(pos, index) + patcher(value)
    pos = index + value.length
  }
  return _contents + contents.slice(pos)
}

const readify = (input: string): TPseudoReadable => {
  const chunks = [null, input]
  return { read: () => chunks.pop() as string }
}

const extract = (readable: TPseudoReadable, _opts?: TOpts): TCodeRef[] => {
  const opts = normalizeOpts(_opts)
  const refs: TCodeRef[] = []
  const pushRef = (type: string, value: string, index: number) => refs.push({ type, value, index })

  let i = 0
  let prev = ''
  let chunk: string | null
  let c: string | null = null
  let q: string | null = null
  let token = ''
  let strLiteral = ''
  let commentBlock = ''
  let commentValue = ''

  while (null !== (chunk = readable.read(opts.bufferSize))) {
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
          if (strLiteral && isDep(token.slice(-15))) pushRef('dep', strLiteral, i - strLiteral.length)
          strLiteral = ''
          token = ''
          q = null
        } else strLiteral += char
      } else if (q === null) {
        if ((c === '/' && char === '\n') || (c === '*' && prev === '*' && char === '/')) {
          commentValue = c === '*' ? commentBlock.slice(0, -1) : commentBlock
          if (commentValue && opts.comments) pushRef('comment', commentValue, i - commentValue.length)
          commentBlock = ''
          token = ''
          c = null
        } else if (opts.comments) commentBlock += char
      }

      prev = char
      i++
      j++
    }
  }

  return refs
}
