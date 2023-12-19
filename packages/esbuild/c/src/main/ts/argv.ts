import minimist from 'minimist'
import {splitNth} from './util.ts'

export const parseArgv = (input: string[]) => {
  // esbuild recognizes --foo:bar --foo:baz as foo: ['bar', 'baz']
  // https://esbuild.github.io/api/
  const _input = input.flatMap(i => /^--[\w-]+:/i.test(i) ? splitNth(i, ':', 1) : i)

  return minimist(_input, {
  })
}
