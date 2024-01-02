import fs from 'node:fs/promises'
import {TConfig, TConfigNormalized, TKeeperCtx, TScript} from './interface.ts'
import {normalizeConfig, normalizeCtx} from './config.ts'
import {keeper as npm} from './keepers/npm.ts'
import {applyScript} from './common.ts'
import {generate, join} from './generator.ts'

export {generate} from './generator.ts'

export const upkeeper = async (_config: TConfig) => {
  const config = normalizeConfig(_config)
  const {keepers, output, dryrun} = config
  const ctxs = await prepare(keepers)
  const {scripts, proposals} = generate(ctxs, config)

  await save(scripts, output)
  await run(scripts, dryrun)

  return {scripts, proposals}
}

export const prepare = async (keepers: TConfigNormalized['keepers']): Promise<TKeeperCtx[]> =>
  (await Promise.all(keepers.map(async ({keeper, options, flags}) => {
    if (keeper !== 'npm') {
      return
    }
    const context = normalizeCtx({cwd: options.cwd, config: {keeper, options, flags}})
    await npm.propose(context)
    await npm.script(context)

    return context
  }))).filter(Boolean) as TKeeperCtx[]

export const save = async (scripts: TScript[], dir?: string) => {
  if (!dir) return

  await fs.mkdir(dir, {recursive: true})
  await Promise.all(scripts.map(async ({name, pre, post, contents}) =>
    fs.writeFile(`${dir}/${name}`, join(pre, contents, post))
  ))
}

export const run = async (scripts: TScript[], dryrun = true, cwd = process.cwd()) => {
  if (dryrun) return

  for (const {contents, pre, post} of scripts) {
    await applyScript(join(pre, contents, post), cwd)
  }
}
