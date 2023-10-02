import {parse} from './parse'
import {process, TProcessContext} from './process'
import {TConfigDeclaration} from './interface'
import {DATA} from "./constants";

export const topoconfig = (cfg: TConfigDeclaration) => {
  const cmds = {[DATA]: (v: any) => typeof v === 'string' && (v.startsWith('{') || v.startsWith('[')) ? JSON.parse(v) : v}
  const {vertexes, edges} = parse(cfg)
  const ctx: TProcessContext = {
    vertexes,
    edges,
    values: {},
    cmds,
  }

  return process(ctx)
}
