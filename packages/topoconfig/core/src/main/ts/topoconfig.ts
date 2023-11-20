import {parse} from './parse.ts'
import {process} from './process.ts'
import {TConfigDeclaration, TProcessContext} from './interface.ts'

export type {TConfigDeclaration} from './interface.ts'

/**
 * Processes config declaration to resolve the output data value.
 *
 * @param {TConfigDeclaration} cfg Config declaration
 * @returns {Promise<any>} Populated config data
 */
export const topoconfig = <T = any>(cfg: TConfigDeclaration): Promise<T> => {
  const { cmds = {} } = cfg
  const { pipelines, edges } = parse(cfg)
  const ctx: TProcessContext = {
    pipelines,
    edges,
    values: {},
    cmds,
  }

  return process<T>(ctx)
}

