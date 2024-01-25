import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import {depseek} from 'depseek'
import * as ts from 'typescript'

export type TOptions = {
  output: string
  tsconfig: string
  temp: string
  // force node prefix
  // shake
}

// https://blog.logrocket.com/common-typescript-module-problems-how-to-solve/#solution-locating-module-resolve-imports
// https://typescript-v2-121.ortam.vercel.app/docs/handbook/module-resolution.html

export const libdef = async (opts?: Partial<TOptions>) => {
  const source = 'let a: string = "bar"'
  let result = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS }})
  const {output} = normalizeOpts(opts)
  // const dts = await fs.readFile(input, 'utf-8')
  // const declarations = extractModuleDeclarations(dts)
  // const sources = await Promise.all(declarations.map(async ({name}) => ({
  //   name,
  //   contents: await fs.readFile(name, 'utf-8')
  // })))
}

export const normalizeOpts = (opts?: Partial<TOptions>): TOptions => ({
  output: './index.d.ts',
  tsconfig: './tsconfig.json',
  temp: tempy(),
  ...opts
})

const tempy = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'tsc-dts-fix-'))

export const extractModuleDeclarations = (input: string): {name: string, contents: string}[] => {
  const lines = input.split('\n')
  const declarations: {name: string, contents: string}[] = []

  let declaration

  for (const line of lines) {
    if (line.startsWith('declare module')) {
      if (declaration) declarations.push(declaration)
      declaration = {name: line.slice(15, -2), contents: ''}
      continue
    }
    if (declaration) declaration.contents += line + '\n'
  }

  return declarations
}
