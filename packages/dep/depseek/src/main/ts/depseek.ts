import { Readable } from 'node:stream'

export type TCodeRef = {
  type: string
  value: string
  index: number
}

export type TOptsNormalized = {
  comments: boolean
  bufferSize: number
  re: RegExp
  offset: number
}

export type TOpts = Partial<TOptsNormalized>

type TPseudoReadable = { read: (size: number) => string | null }

export const fullRe =           /((\.{3}|\s|[!%&(*+,/:;<=>?[^{|}~-]|^)(require\s?(\.\s?resolve\s?)?\(\s?|import\s?\(?\s?)|\sfrom)\s?$/
export const importRe =         /((\.{3}|\s|[!%&(*+,/:;<=>?[^{|}~-]|^)import\s?\(?\s?|\sfrom)\s?$/
export const importRequireRe =  /((\.{3}|\s|[!%&(*+,/:;<=>?[^{|}~-]|^)(require\s?\(\s?|import\s?\(?\s?)|\sfrom)\s?$/
export const requireRe =        /((\.{3}|\s|[!%&(*+,/:;<=>?[^{|}~-]|^)require\s?\(\s?)\s?$/
export const requireResolveRe = /((\.{3}|\s|[!%&(*+,/:;<=>?[^{|}~-]|^)(require\s?(\.\s?resolve\s?)?\(\s?))\s?$/

const isDep = (proposal: string, re: RegExp) => !!proposal && re.test(proposal)
const isSpace = (value: string) => value === ' ' || value === '\n' || value === '\t'
const normalizeOpts = (opts?: TOpts): TOptsNormalized => ({
  bufferSize: 1000,
  comments: false,
  re: importRequireRe,
  offset: 19,
  ...opts
})
export const depseek = (stream: Readable | string | Buffer, opts?: TOpts): Promise<TCodeRef[]> => new Promise((resolve, reject) => {
  if (typeof stream === 'string' || stream instanceof Buffer) {
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

export const depseekSync = (input: string | Buffer, opts?: TOpts): TCodeRef[] => extract(readify(input.toString()), opts)

export const patchRefs = (contents: string | Buffer, patcher: (ref: string) => string): string => {
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
  const {re, comments, bufferSize, offset} = normalizeOpts(_opts)
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

  while (null !== (chunk = readable.read(bufferSize))) {
    const len = chunk.length
    let j = 0

    while (j < len) {
      const char = chunk[j]
      if (c === q) {
        if (isSpace(char)) {
          if (!isSpace(prev)) token += char
        }
        else if (char === '"' || char === "'" || char === '`') q = char
        else if (prev === '/' && (char === '/' || char === '*')) c = char
        else token += char
      } else if (c === null) {
        if (q === char && prev !== '\\') {
          if (strLiteral && isDep(token.slice(-offset), re)) pushRef('dep', strLiteral, i - strLiteral.length)
          strLiteral = ''
          token = ''
          q = null
        } else strLiteral += char
      } else if (q === null) {
        if ((c === '/' && char === '\n') || (c === '*' && prev === '*' && char === '/')) {
          commentValue = c === '*' ? commentBlock.slice(0, -1) : commentBlock
          if (commentValue && comments) pushRef('comment', commentValue, i - commentValue.length)
          commentBlock = ''
          token = token.slice(0,-1)
          c = null
        } else if (comments) commentBlock += char
      }

      prev = char
      i++
      j++
    }
  }

  return refs
}
