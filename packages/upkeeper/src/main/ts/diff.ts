import {quote, spawn} from './util.ts'

export const sedPatch = async (a: string, b: string, target: string): Promise<string> => {
  const linesA = a.split('\n')
  const linesB = b.split('\n')

  // eslint-disable-next-line unicorn/no-for-loop
  for (let i = 0; i < linesA.length; i++) {
    if (linesA[i] !== linesB[i]) {
      return `sed -i '' '${i+1}s/.*/${linesB[i].replace('/', '\\/')}/' ${target}`
    }
  }
  return ''
}

export const gitDiff = async (a: string, b: string, target: string): Promise<string> => {
  const patch = (await spawn('git', [
    'diff',
    // '-U0',
    '--diff-algorithm=patience',
    //'--minimal',
    `$(echo ${quote(a)} | git hash-object -w --stdin)`,
    `$(echo ${quote(b)} | git hash-object -w --stdin)`,
  ], {shell: 'bash', silent: true})).stdout
  const prefix = `diff --git a/${target} b/${target}
--- a/${target}
+++ b/${target}
`

  return prefix + patch.slice(patch.indexOf('@'))
    .replaceAll('\n-$', '\n-')
    .replaceAll('\n+$', '\n+')
}

export const gitPatch = async (a: string, b: string, target: string): Promise<string> => {
  const patch = await gitDiff(a, b, target)

  return `echo ${quote(patch)} | git apply -C0 --inaccurate-eof --whitespace=fix`
}

export const getPatch = async (a: string, b: string, target: string, diff = 'git'): Promise<string> =>
  diff === 'git'
    ? gitPatch(a, b, target)
    : sedPatch(a, b, target)
