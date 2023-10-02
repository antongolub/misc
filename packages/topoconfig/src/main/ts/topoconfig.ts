import {parse} from './parse'
import {process} from './process'
import {TConfigDeclaration, TProcessContext} from './interface'

export type {TConfigDeclaration} from './interface'

export const topoconfig = (cfg: TConfigDeclaration) => {
  const { cmds = {} } = cfg
  const {vertexes, edges} = parse(cfg)
  const ctx: TProcessContext = {
    vertexes,
    edges,
    values: {},
    cmds,
  }

  return process(ctx)
}

