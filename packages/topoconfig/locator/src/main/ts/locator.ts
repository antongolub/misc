import {TParseOpts, TReference, TReferenceKind} from './interface.js'

export const stringify = ({repo, kind, file, rev}: TReference) => {
  if (kind === 'github') {
    return `${kind}>${repo?.owner}/${repo?.name}:${file}#${rev}`
  }

  throw new Error(`unsupported kind: ${kind}`)
}

export const parse = (input: string, opts: TParseOpts = {}): TReference => {
  const defaults = {...defaultDefaults, ...opts.defaults}
  const proposal = parseRenovateRef(input, defaults)

  if (!proposal) throw new Error(`unsupported ref: ${input}`)

  return {
    ...defaults,
    ...proposal
  }
}

export const resolve = (ref: TReference | string) => {
  const {repo, kind, file, rev} = typeof ref === 'string' ? parse(ref) : ref
  if (kind === 'github') {
    return `https://raw.githubusercontent.com/${repo?.owner}/${repo?.name}/${rev}/${file}`
  }

  throw new Error(`unsupported kind: ${kind}`)
}

// https://docs.renovatebot.com/config-presets/#github
const renovateRefRe = /^(github|gitlab|gitea|local)>([\w-]+)\/(\.?[\w-]+)(?::([\w./-]+))?(?:#([\w.-]+))?$/i
const parseRenovateRef = (input: string, defaults: Record<string, any>): TReference | undefined => {
  const [
    _,
    kind,
    owner,
    name,
    file= defaults.file,
    rev= defaults.rev,
  ] = renovateRefRe.exec(input) || []

  if (!_) return

  return {
    kind: (kind as TReferenceKind),
    repo: {
      owner,
      name,
    },
    file,
    rev,
  }
}

const defaultDefaults = {
  file: 'config.json',
  rev: 'main'
}
