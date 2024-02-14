import {TParseOpts, TReference, TReferenceKind, TStringifyOpts} from './interface.js'

const defaultDefaults = {
  file: 'config.json',
  rev: 'main'
}

export const parse = (input: string, opts: TParseOpts = {}): TReference => {
  const defaults = {...defaultDefaults, ...opts.defaults}
  const proposal = parseRenovateRef(input, defaults) || parseGithubRef(input, defaults)

  if (!proposal) throw new Error(`unsupported ref: ${input}`)

  return {
    ...defaults,
    ...proposal
  }
}

const inj = (prefix = '', value?: string, def?: string, omit?: boolean) =>
  value && (omit ? value !== def : true)
    ? prefix + value
    : ''
export const stringify = ({repo, kind, file, rev}: TReference, {format = 'renovate', defaults, omitDefaults: o}: TStringifyOpts = {}) => {
  const d = {...defaultDefaults, ...defaults}
  if (format === 'renovate') {
    if (!['github', 'gitlab', 'gitea'].includes(kind)) throw new Error(`unsupported kind: ${kind}`)
    return `${kind}>${repo?.owner}/${repo?.name}${inj(':', file, d.file, o)}${inj('#', rev, d.rev, o)}`
  }

  if (format === 'github')
    return `${repo?.owner}/${repo?.name}${inj(':', file, d.file, o)}${inj('@', rev, d.rev, o)}`

  throw new Error(`unsupported format: ${format}`)
}

export const resolve = (ref: TReference | string) => {
  const {repo, kind, file, rev} = typeof ref === 'string' ? parse(ref) : ref
  if (kind === 'github')
    return `https://raw.githubusercontent.com/${repo?.owner}/${repo?.name}/${rev}/${file}`

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

const ghRefRe = /^([\w-]+)\/(\.?[\w-]+)(?:[/:]([\w./-]+))?(?:@([\w.-]+))?$/i
const parseGithubRef = (input: string, defaults: Record<string, any>): TReference | undefined => {
  const [
    _,
    owner,
    name,
    file= defaults.file,
    rev= defaults.rev,
  ] = ghRefRe.exec(input) || []

  if (!_) return

  return {
    kind: 'github',
    repo: {
      owner,
      name,
    },
    file,
    rev,
  }
}
