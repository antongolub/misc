import {TConfig, TConfigNormalized, TKeeperCtx} from './interface.ts'
import {normalizeConfig, normalizeCtx} from './config.ts'
import {keeper as npm} from './keepers/npm.ts'
import {getScriptName} from './common.js'

export const upkeeper = async (_config: TConfig) => {
  const {keepers, pre, post} = normalizeConfig(_config)
  const proposals: any[] = []
  const scripts: Record<string, string> = {}

  for (const ctx of await prepare(keepers)) {
    for (const proposal of ctx.proposals) {
      // TODO implement granularity logic
      const script = [pre, proposal.script, post].filter(Boolean).join('\n')
      const scriptName = getScriptName(ctx.keeper, proposal.action, proposal.resource, proposal.data.name, proposal.data.version)
      scripts[scriptName] = script
      proposals.push(proposal)
    }
  }

  return {scripts, proposals}
}

const prepare = async (keepers: TConfigNormalized['keepers']): Promise<TKeeperCtx[]> =>
  (await Promise.all(keepers.map(async ({keeper, options}) => {
    console.log('!!!', keepers)
    if (keeper !== 'npm') {
      return
    }
    const context = normalizeCtx({cwd: options.cwd, config: {keeper, options}})
    await npm.propose(context)
    await npm.script(context)

    return context
  }))).filter(Boolean) as TKeeperCtx[]
