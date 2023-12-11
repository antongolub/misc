import fs from 'node:fs/promises'
import {TConfig, TConfigNormalized, TKeeperCtx, TProposal} from './interface.ts'
import {normalizeConfig, normalizeCtx} from './config.ts'
import {keeper as npm} from './keepers/npm.ts'
import {applyScript, getScriptName} from './common.ts'
import {tpl} from "./util.js";

export const upkeeper = async (_config: TConfig) => {
  const config = normalizeConfig(_config)
  const {keepers, output} = config
  const ctxs = await prepare(keepers)
  const {scripts, proposals} = generate(ctxs, config)

  await save(scripts, output)
  await run(scripts, config.dryrun)

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

export const generate = (ctxs: TKeeperCtx[], config: TConfigNormalized): {scripts: [string, string][], proposals: TProposal[]} => {
  const {combine, pre, post} = config
  const proposals: TProposal[] = []
  const scripts: [string, string][] = []
  const prefix = `#!/usr/bin/env bash
set -e`

  for (const ctx of ctxs) {
    for (const proposal of ctx.proposals) {
      // TODO implement granularity logic

      const script = [!combine && prefix, tpl(pre, proposal), proposal.script, tpl(post, proposal)].filter(Boolean).join('\n')
      const scriptName = getScriptName(ctx.keeper, proposal.action, proposal.resource, proposal.data.name, proposal.data.version)
      scripts.push([scriptName, script])
      proposals.push(proposal)
    }
  }

  if (combine) {
    return {
      scripts: [['upkeeper.sh', [prefix, ...scripts.map(([,s]) => s)].join('\n\n') + '\n']],
      proposals
    }
  }

  return {scripts, proposals}
}

export const save = async (scripts: [string, string][], dir?: string) => {
  if (!dir) return

  await fs.mkdir(dir, {recursive: true})
  await Promise.all(scripts.map(async ([name, contents]) => {
    await fs.writeFile(`${dir}/${name}`, contents)
  }))
}

export const run = async (scripts: [string, string][], dryrun: boolean = true, cwd = process.cwd()) => {
  if (dryrun) return

  for (const [,script] of scripts) {
    await applyScript(script, cwd)
  }
}
