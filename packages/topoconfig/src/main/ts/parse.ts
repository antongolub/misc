import {TConfigDeclaration, TConfigGraph, TDirective} from './interface'

export const parseRefs = (chunk: string) => {
  const refPattern = /\$\w+/g
  const refs = chunk.match(refPattern) || []

  return refs.map(r => r.slice(1))
}

export const parseDirectives = (value: string): TDirective[] => {
  if (value[0] === '/') {
    return [{
      provider: 'echo',
      args: [value.slice(1)],
      refs: [],
    }]
  }

  const directives: any[] = []
  const vl = value.length
  const capture = () => {
    if (bb > 0) {
      return
    }
    directives.push({
      provider,
      args: [...args]
    })
    provider = ''
    word = ''
    args.length = 0
  }
  let args: string[] = []
  let provider: string
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

    if (!provider) {
      provider = word
    } else {
      args.push(word)
    }
    word = ''
  })

  capture()

  return directives.map(({args, provider}) =>({provider, args, refs: args.map((a: string) => parseRefs(a)).flat()}))
}

export const parse = ({data, sources}: TConfigDeclaration): TConfigGraph => {
  const vertexes: Record<string, TDirective[]> = {}
  const edges: [string, string][] = []

  Object.entries(sources).forEach(([k, value]) => {
    const directives = parseDirectives(value as string)
    vertexes[k] = directives

    directives.forEach(({refs}) => refs.forEach(ref => edges.push([ref, k])))
  })

  return {
    vertexes,
    edges
  }
}
