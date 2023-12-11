import fs from 'node:fs/promises'
import {TConfig, TConfigNormalized, TKeeperCtx} from './interface.ts'
import {normalizeConfig, normalizeCtx} from './config.ts'
import {keeper as npm} from './keepers/npm.ts'
import {getScriptName} from './common.ts'

export const upkeeper = async (_config: TConfig) => {
  const config = normalizeConfig(_config)
  const {keepers, output} = config
  const ctxs = await prepare(keepers)
  const {scripts, proposals} = generate(ctxs, config)

  await save(scripts, output)

  return {scripts, proposals}
}

export const prepare = async (keepers: TConfigNormalized['keepers']): Promise<TKeeperCtx[]> =>
  (await Promise.all(keepers.map(async ({keeper, options}) => {
    if (keeper !== 'npm') {
      return
    }
    const context = normalizeCtx({cwd: options.cwd, config: {keeper, options}})
    await npm.propose(context)
    await npm.script(context)

    return context
  }))).filter(Boolean) as TKeeperCtx[]

export const generate = (ctxs: TKeeperCtx[], config: TConfigNormalized) => {
  const {combine, pre, post} = config
  const proposals: any[] = []
  const scripts: Record<string, string> = {}
  const prefix = `#!/usr/bin/env bash
set -e`

  for (const ctx of ctxs) {
    for (const proposal of ctx.proposals) {
      // TODO implement granularity logic

      const script = [!combine && prefix, pre, proposal.script, post].filter(Boolean).join('\n')
      const scriptName = getScriptName(ctx.keeper, proposal.action, proposal.resource, proposal.data.name, proposal.data.version)
      scripts[scriptName] = script
      proposals.push(proposal)
    }
  }

  if (combine) {
    return {
      scripts: {'upkeeper.sh': [prefix, ...Object.values(scripts)].join('\n\n') + '\n'},
      proposals
    }
  }

  return {scripts, proposals}
}

export const save = async (scripts: Record<string, string>, dir?: string) => {
  if (!dir) return

  await fs.mkdir(dir, {recursive: true})
  await Promise.all(Object.entries(scripts).map(async ([name, contents]) => {
    await fs.writeFile(`${dir}/${name}`, contents)
  }))
}
