import {TDirective, TConfigDeclaration, TConfigGraph} from './interface'

export * from './foo'

export const topoconfig = ({data, sources = {}}: TConfigDeclaration) => {
  return {}
}

const providers = {
  echo(v: any) {
    return v
  }
}
