import {TConfigDeclaration, TConfigGraph, TData, TDirective} from './interface'

export const parseRefs = (chunk: string) => {
  const refPattern = /\$\w+/g
  const refs = chunk.match(refPattern) || []

  return refs.map(r => r.slice(1))
}

export const parseDirectives = (value: string): TDirective[] => {
  if (value[0] === '/') {
    return [{
      cmd: 'echo',
      args: [value.slice(1)],
      refs: [],
      mappings: {}
    }]
  }

  const directives: any[] = []
  const vl = value.length
  const capture = () => {
    if (bb > 0) {
      return
    }
    directives.push({
      cmd,
      args: [...args]
    })
    cmd = ''
    word = ''
    args.length = 0
  }
  let args: string[] = []
  let cmd: string
  let word = ''
  let bb = 0; // bracket balance

  [...value].forEach((c, i) => {
    bb += c === '{' ? 1 : c === '}' ? -1 : 0
    if (bb > 0) {
      word += c
      return
    }

    if (/[^\s]/.test(c)) {
      word += c
      if (i !== vl - 1) {
        return
      }
    }

    if (word === '>') {
      capture()
      return
    }

    if (!cmd) {
      cmd = word
    } else {
      args.push(word)
    }
    word = ''
  })

  capture()

  return directives.map(({args, cmd}) =>({cmd, args, refs: args.map((a: string) => parseRefs(a)).flat(), mappings: {}}))
}


export type TParseContext = {
  prefix: string
  vertexes: Record<string, TDirective[]>
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

export const parse = ({data, sources}: TConfigDeclaration, parent: TParseContext = {
  prefix: '',
  vertexes: {},
  edges: [],
  refs: []
}, prefix = ''): TConfigGraph => {
  const {vertexes, edges} = parent
  const refs = Object.keys(sources)
  const ctx = {
    vertexes,
    edges,
    refs,
    parent,
    prefix,
  }

  refs.forEach(k => {
    const key = resolveRefKey(k, ctx)
    const value = sources[k]

    if (typeof value === 'string') {
      const directives = parseDirectives(value as string)
      vertexes[key] = directives
      directives.forEach(directive => {
        const {refs: _refs, mappings} = directive

        _refs.forEach(ref => {
          const from = resolveRefKey(ref, ctx)
          mappings[ref] = from
          edges.push([from, key])
        })
      })
      return
    }

    parse(value, {...ctx, prefix: k})
  })

  console.log(
    'vertexes=',JSON.stringify(vertexes),
    'edges=', JSON.stringify(edges)
  )

  return {
    vertexes,
    edges
  }
}
