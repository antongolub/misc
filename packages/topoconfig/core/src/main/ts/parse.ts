import {TConfigDeclaration, TConfigGraph, TData, TInjects, TPipeline, TParseContext} from './interface.ts'
import { DATA, VARARG } from './constants.ts'
import {flatten, reverseMap} from './util.ts'

export const parseInjects = (chunk: string): TInjects =>
  chunk
    .split(/(\$\w+(?:\.\w+)*(?:\.(?=\.))?)/g)
    .reduce<TInjects>((o, raw, i) => {
      if (i % 2 === 0) return o

      const d = raw.indexOf('.')
      const [ref, path] = d === -1 ? [raw.slice(1), '.'] : [raw.slice(1, d), raw.slice(d + 1)]

      o[raw] = {raw, ref, path}
      return o
    }, {})

export const parseDataInjects = (data: TData, injects: TInjects = {}) => {
  const type = data === null ? 'null' : typeof(data)

  switch (type) {
    case 'string':
      Object.assign(injects, parseInjects(data as string))
      break
    case 'null':
    case 'number':
      break
    case 'object':
      Object.values(data).forEach(v => parseDataInjects(v, injects))
      break
    default:
      throw new Error(`unsupported data type: ${type}`)
  }

  return injects
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

const rops = reverseMap(ops)

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
      mappings: {},
      injects: {}
    }]
  }

  const words = parseWords(value)
  const directives: TPipeline = []
  const capture = () => {
    args.length > 0 && directives.push({
      cmd: args.shift() as string,
      args,
      injects: Object.assign({}, ...args.map(parseInjects)),
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

export const formatRefKey = (key: string, prefix?: string, delimiter = ':') => `${prefix ? prefix + delimiter : ''}${key}`

export const resolveRefKey = (key: string, ctx: TParseContext): string => {
  let scope: TParseContext | undefined = ctx
  let ref

  while (scope) {
    if (!ref && scope.nodes.includes(key)) {
      ref = key
    }
    if (ref && scope.prefix) {
      ref = formatRefKey(ref, scope.prefix)
    }
    scope = scope.parent
  }

  return ref || key
}

export const parseDataArgs = (data: any) => typeof data === 'string'
  ? [data]
  : Object.entries(flatten(data)).flatMap(entry => [VARARG, ...entry])

export const populateMappings = (ctx: TParseContext, directives: TPipeline, key = ctx.prefix) => {
  ctx.pipelines[key] = directives
  directives.forEach(directive => {
    if (directive.op !== undefined) {
      return
    }
    const {injects, mappings} = directive
    const nodes = Object.values(injects).map(({ref}) => ref)
    nodes.forEach(node => {
      const from = resolveRefKey(node, ctx)
      mappings[node] = from
      ctx.edges.push([from, key])
    })
  })
}

export const parse = ({data, sources = {}}: TConfigDeclaration, parent: TParseContext = {
  prefix: '',
  pipelines: {},
  edges: [],
  nodes: []
}, prefix = ''): TConfigGraph => {
  const {pipelines, edges} = parent
  const nodes = Object.keys(sources)
  const ctx = {
    pipelines,
    edges,
    nodes,
    parent,
    prefix,
  }

  populateMappings(ctx, [{
    cmd: DATA,
    args: parseDataArgs(data),
    injects: parseDataInjects(data),
    mappings: {}
  }])

  nodes.forEach(k => {
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
    pipelines,
    edges
  }
}
