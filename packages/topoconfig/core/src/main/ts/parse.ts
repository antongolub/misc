import {TConfigDeclaration, TConfigGraph, TData, TDirective, TPipeline} from './interface'
import {DATA} from './constants'

export const parseRefs = (chunk: string) => {
  const refPattern = /\$\w+/g
  const refs = chunk.match(refPattern) || []

  return refs.map(r => r.slice(1))
}

const ops = {
  pipe: '>',
  or: '||',
  tif: '?',
  telse: ':',
  space: ' ',
  eq: '=',
  // sq: "'",
  // dq: '"',
  // rc: '}',
  // lc: '{'
}

const rops = Object.entries(ops).reduce<Record<string, string>>((m, [k, v]) => {
  m[v] = k
  return m
}, {})

export const populate = Symbol('polupate')

// Maybe use smth like https://github.com/MeLlamoPablo/minimist-string/blob/master/index.js instead?
export const parseWords = (value: string): string[] => {
  const chars = [' ', ...value, ' ']
  const words: string[] = []

  let chunk = ''
  let bb = 0 // brackets balance
  let qb = '' // quotes balance

  // eslint-disable-next-line sonarjs/cognitive-complexity
  chars.forEach((c, i) => {
    const prev = chars[i - 1]
    const next = chars[i + 1]
    if (prev !== '\\') {
      bb += qb ? bb : c === '{' ? 1 : c === '}' ? -1 : 0
      qb = (c === "'" || c === '"') && !bb && (prev === ops.space || prev === ops.eq || next === ops.space) ? qb ? qb === c ? '' : qb : c : qb
    }

    if (bb > 0 || qb || c !== ops.space) {
      chunk += c
      return
    }

    chunk && words.push(chunk)
    chunk = ''
  })

  return words
}

export const parseDirectives = (value: string): TPipeline => {
  if (value[0] === '\\') {
    return [{
      cmd: 'echo',
      args: [value.slice(1)],
      refs: [],
      mappings: {}
    }]
  }

  const words = parseWords(value)
  const directives: TPipeline = []
  const capture = () => {
    args.length > 0 && directives.push({
      cmd: args.shift() as string,
      args,
      refs: args.flatMap((a: string) => parseRefs(a)),
      mappings: {}
    })
    args = []
  }

  let args: string[] = []

  words.forEach(w => {
    const op = rops[w]
    switch (op) {
      case 'pipe':
        capture()
        return
      case 'tif':
      case 'telse':
      case 'or':
        capture()
        directives.push({op})
        return
    }
    args.push(w)
  })

  capture()

  return directives
}

export type TParseContext = {
  prefix: string
  vertexes: Record<string, TPipeline>
  edges: [string, string][]
  refs: string[]
  parent?: TParseContext
}

export const formatRefKey = (key: string, prefix?: string, delimiter = ':') => `${prefix ? prefix + delimiter : ''}${key}`

export const resolveRefKey = (key: string, ctx: TParseContext): string => {
  let scope: TParseContext | undefined = ctx
  let ref

  while (scope) {
    if (!ref && scope.refs.includes(key)) {
      ref = key
    }
    if (ref && scope.prefix) {
      ref = formatRefKey(ref, scope.prefix)
    }
    scope = scope.parent
  }

  return ref || key
}

export const parseDataRefs = (data: TData, refs: string[] = []) => {
  const type = data === null ? 'null' : typeof(data)

  switch (type) {
    case 'string':
      refs.push(...parseRefs(data as string))
      break
    case 'null':
    case 'number':
      break
    case 'object':
      Object.values(data).forEach(v => parseDataRefs(v, refs))
      break
    default:
      throw new Error(`unsupported data type: ${type}`)
  }

  return refs
}

export const populateMappings = (ctx: TParseContext, directives: TPipeline, key = ctx.prefix) => {
  ctx.vertexes[key] = directives
  directives.forEach(directive => {
    if (directive.op !== undefined) {
      return
    }
    const {refs: _refs, mappings} = directive
    _refs.forEach(ref => {
      const from = resolveRefKey(ref, ctx)
      mappings[ref] = from
      ctx.edges.push([from, key])
    })
  })
}

export const parse = ({data, sources}: TConfigDeclaration, parent: TParseContext = {
  prefix: '',
  vertexes: {},
  edges: [],
  refs: []
}, prefix = ''): TConfigGraph => {
  const {vertexes, edges} = parent
  const refs = Object.keys(sources)
  const dataRefs = parseDataRefs(data)
  const ctx = {
    vertexes,
    edges,
    refs,
    parent,
    prefix,
  }

  populateMappings(ctx, [{cmd: DATA, args: [JSON.stringify(data)], refs: dataRefs, mappings: {}}])

  refs.forEach(k => {
    const key = resolveRefKey(k, ctx)
    const value = sources[k]

    if (typeof value === 'string') {
      const directives = parseDirectives(value as string)
      populateMappings(ctx, directives, key)
      return
    }

    parse(value, ctx, k)
  })

  // console.log(
  //   'vertexes=',JSON.stringify(vertexes),
  //   'edges=', JSON.stringify(edges)
  // )

  return {
    vertexes,
    edges
  }
}
