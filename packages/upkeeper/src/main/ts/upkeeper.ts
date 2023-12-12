import fs from 'node:fs/promises'
import {TConfig, TConfigNormalized, TKeeperCtx, TProposal, TResource} from './interface.ts'
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

export const generate = (ctxs: TKeeperCtx[], config: TConfigNormalized): {scripts: TResource[], proposals: TProposal[]} => {
  const {combine, pre, post} = config
  const proposals: TProposal[] = []
  const scripts: TResource[] = []
  const prefix = `#!/usr/bin/env bash
set -e`

  for (const ctx of ctxs) {
    for (const proposal of ctx.proposals) {
      // TODO implement granularity logic

      const contents = [!combine && prefix, tpl(pre, proposal), proposal.script, tpl(post, proposal)].filter(Boolean).join('\n')
      const name = getScriptName(ctx.keeper, proposal.action, proposal.resource, proposal.data.name, proposal.data.version)
      scripts.push({name, contents})
      proposals.push(proposal)
    }
  }

  if (combine) {
    return {
      scripts: [{name: 'upkeeper.sh', contents: [prefix, ...scripts.map((r) => r.contents)].join('\n\n') + '\n'}],
      proposals
    }
  }

  return {scripts, proposals}
}

export const save = async (scripts: TResource[], dir?: string) => {
  if (!dir) return

  await fs.mkdir(dir, {recursive: true})
  await Promise.all(scripts.map(async ({name, contents}) => {
    await fs.writeFile(`${dir}/${name}`, contents)
  }))
}

export const run = async (scripts: TResource[], dryrun: boolean = true, cwd = process.cwd()) => {
  if (dryrun) return

  for (const {contents} of scripts) {
    await applyScript(contents, cwd)
  }
}
