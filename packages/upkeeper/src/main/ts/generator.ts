import {TConfigNormalized, TKeeperCtx, TProposal, TResource, TScript} from './interface.ts'
import {tpl} from './util.ts'
import {getScriptName} from './common.ts'

const prefix = `#!/usr/bin/env bash
set -e`

export const nameGens = {
  proposal: (ctx: TKeeperCtx, proposal: TProposal) => getScriptName(ctx.keeper, proposal.action, proposal.resource, proposal.data.name, proposal.data.version),
  same:     (ctx: TKeeperCtx, proposal: TProposal) => getScriptName(ctx.keeper, proposal.action, proposal.data.name, proposal.data.version),
  resource: (ctx: TKeeperCtx, proposal: TProposal) => getScriptName(ctx.keeper, proposal.action, proposal.resource),
  'all-in': (ctx: TKeeperCtx, proposal: TProposal) => getScriptName(ctx.keeper, proposal.action)
}

export const generate = (ctxs: TKeeperCtx[], config: TConfigNormalized): {scripts: TScript[], proposals: TProposal[]} => {
  const {combine, pre, post, granularity} = config
  const {scripts, proposals} = granulateBy(ctxs, config, nameGens[granularity])

  if (combine) {
    return {
      scripts: [{
        name: 'upkeeper.sh',
        pre: prefix,
        post: '',
        contents: scripts
          .flatMap(({pre, contents, post}) => join(pre, contents, post))
          .join('\n\n') + '\n'
      }],
      proposals
    }
  }

  return {scripts, proposals}
}

export const granulateBy = (ctxs: TKeeperCtx[], config: TConfigNormalized, namegen: (ctx: TKeeperCtx, proposal: TProposal) => string) => {
  const proposals: TProposal[] = []
  const scripts: TScript[] = []
  const {combine, pre, post} = config

  for (const ctx of ctxs) {
    for (const proposal of ctx.proposals) {
      proposals.push(proposal)
      upsertScript(scripts, {
        name:     namegen(ctx, proposal),
        contents: proposal.script as string,
        pre:      join(!combine && prefix, tpl(pre, proposal)),
        post:     tpl(post, proposal) || ''
      })
    }
  }

  return {scripts, proposals}
}

const upsertScript = (scripts: TResource[], script: TScript): TResource => {
  const found = scripts.find((s) => s.name === script.name)
  if (!found) {
    scripts.push(script)
    return script
  }

  found.contents += `\n${script.contents}`
  return found
}

export const join = (...chunks: (string | undefined | boolean)[]): string => chunks.filter(Boolean).join('\n')
