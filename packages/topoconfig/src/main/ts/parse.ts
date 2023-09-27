import {TConfigDeclaration, TConfigGraph, TDirective} from './interface'

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

export const resolveRefKey = (key: string, ctx: TParseContext) => {
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

  return ref
}

export const parse = ({data, sources}: TConfigDeclaration, parent: TParseContext = {
  prefix: '',
  vertexes: {},
  edges: [],
  refs: []
}): TConfigGraph => {
  const {vertexes, edges} = parent
  const refs = Object.keys(sources)
  const ctx = {
    vertexes,
    edges,
    refs,
    parent,
  }

  refs.forEach(k => {
    const value = sources[k]
    const key = k // formatKey(k, prefix)
    if (typeof value === 'string') {
      const directives = parseDirectives(value as string)
      vertexes[key] = directives
      directives.forEach(directive => {
        const {refs} = directive

        refs.forEach(ref => edges.push([ref, key]))
      })
      return
    }

    // parse(value, {
    //   vertexes,
    //   edges
    // })
  })

  return {
    vertexes,
    edges
  }
}
