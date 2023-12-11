import dot from 'dot'

import cp from 'node:child_process'

export const spawn = (
  cmd: string,
  args: ReadonlyArray<string> = [],
  opts: Record<string, any> = {}
): Promise<{stdout: string, stderr: string}> => new Promise((resolve, reject) => {
  let status: number | null = 0
  const now = Date.now()
  const stderr: string[] = []
  const stdout: string[] = []
  const {nothrow, silent, input} = opts
  const p = cp.spawn(cmd, args, opts)

  if (input) {
    p.stdin.write(input)
    p.stdin.end()
  }
  p.stdout.on('data', (data) => stdout.push(data.toString()))
  p.stderr.on('data', (data) => stderr.push(data.toString()))

  p.on('error', (e) => stderr.push(e.toString()))
  p.on('exit', (code) => {
    status = code
  })
  p.on('close', () => {
    const result = {
      stderr: stderr.join(''),
      stdout: stdout.join(''),
      status: status,
      signalCode: p.signalCode,
      duration: Date.now() - now,
    }

    if (!silent) {
      result.stdout && console.log(result.stdout)
      result.stderr && console.error(result.stderr)
    }

    (status && !nothrow ? reject : resolve)(result)
  })
})

export function quote(arg: string) {
  // eslint-disable-next-line unicorn/better-regex
  if (/^[a-z0-9/_.\-@:=]+$/i.test(arg) || arg === '') {
    return arg
  }
  return (
    `$'` +
    arg
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\f/g, '\\f')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t')
      .replace(/\v/g, '\\v')
      .replace(/\0/g, '\\0') +
    `'`
  )
}


export const tpl = (input?: string, opts: Record<string, any> = {}) => input && dot.template(input)(opts)

export const asArray = (input: string | string[]): string[] => [input]
  .flat()
  .filter(Boolean)
  .flatMap(s => s.split(','))

export const memoize = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map()
  return ((...args: any[]) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn(...args)
    cache.set(key, result)
    return result
  }) as any
}
