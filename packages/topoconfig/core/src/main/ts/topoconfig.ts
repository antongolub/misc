import {parse} from './parse'
import {process} from './process'
import {TConfigDeclaration, TProcessContext} from './interface'

export type {TConfigDeclaration} from './interface'

/**
 * Processes config declaration to resolve the output data value.
 *
 * @param {TConfigDeclaration} cfg Config declaration
 * @returns {Promise<any>} Populated config data
 */
export const topoconfig = <T = any>(cfg: TConfigDeclaration): Promise<T> => {
  const { cmds = {} } = cfg
  const {vertexes, edges} = parse(cfg)
  const ctx: TProcessContext = {
    vertexes,
    edges,
    values: {},
    cmds,
  }

  return process<T>(ctx)
}

