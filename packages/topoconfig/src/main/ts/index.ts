import {TConfigOpts} from './interface'

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

export const parseDirective = (value: string) => {
  if (value[0] === '/') {
    return [{
      provider: 'echo',
      args: [value.slice(1)]
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

  return directives
}


