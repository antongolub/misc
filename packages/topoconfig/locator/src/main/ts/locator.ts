import {TParseOpts, TReference, TReferenceKind, TStringifyOpts} from './interface.js'

const defaultDefaults = {
  file: 'config.json',
  rev: 'main'
}

export const parse = (input: string, opts: TParseOpts = {}): TReference => {
  const defaults = {...defaultDefaults, ...opts.defaults}
  const proposal = parseRenovateRef(input, defaults) || parseGithubRef(input, defaults)

  if (!proposal) throw new Error(`unsupported ref: ${input}`)

  return Object.defineProperty({
    ...defaults,
    ...proposal
  }, 'defaults', {value: defaults, enumerable: false})
}

const part = (prefix = '', value?: string, def?: string, omit?: boolean) =>
  value && (omit ? value !== def : true)
    ? prefix + value
    : ''
export const stringify = ({repo, kind, file, rev, defaults: _d}: TReference, {format = 'renovate', defaults, short, omitDefaults: o = short}: TStringifyOpts = {}) => {
  const d = {...defaultDefaults, _d,...defaults}
  if (format === 'renovate') {
    if (!['github', 'gitlab', 'gitea'].includes(kind)) throw new Error(`unsupported kind: ${kind}`)
    return `${kind}>${repo?.owner}/${repo?.name}${part(':', file, d.file, o)}${part('#', rev, d.rev, o)}`
  }

  if (format === 'github')
    return `${repo?.owner}/${repo?.name}${part(':', file, d.file, o)}${part('@', rev, d.rev, o)}`

  throw new Error(`unsupported format: ${format}`)
}

export const resolve = (ref: TReference | string, opts?: TParseOpts) => {
  const {repo, kind, file, rev} = typeof ref === 'string' ? parse(ref, opts) : ref
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
