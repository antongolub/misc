import {TDirective, TConfigOpts} from './interface'

export * from './foo'

export const topoconfig = ({data, sources = {}}: TConfigOpts) => {
  return {}
}

type IPipe = {

}

const providers = {
  echo(v: any) {
    return v
  }
}

export const parseRefs = (chunk: string) => {
  const refPattern = /\$\w+/g
  const refs = chunk.match(refPattern) || []

  return refs.map(r => r.slice(1))
}

export const parseDirective = (value: string): TDirective[] => {
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

  return directives.map(({args, provider}) => ({provider, args, refs: args.map((a: string) => parseRefs(a)).flat()}))
}
