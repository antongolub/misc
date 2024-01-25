import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { depseekSync } from 'depseek'
import ts from 'typescript'

export type TOptions = {
  input: string
  output: string
  tsconfig: string
  temp: string
  compilerOptions: ts.CompilerOptions,
  strategy: 'separate' | 'bundle' | 'merge'
  // force node prefix
  // shake
}

// https://blog.logrocket.com/common-typescript-module-problems-how-to-solve/#solution-locating-module-resolve-imports
// https://typescript-v2-121.ortam.vercel.app/docs/handbook/module-resolution.html
export const generateDts = (opts?: Partial<TOptions>) => {
  const {output, input, compilerOptions, strategy} = normalizeOpts(opts)
  const outFile = strategy === 'separate' ? undefined : 'bundle.d.ts'
  const rootDir = strategy === 'bundle' ? '../'.repeat(100) : compilerOptions.rootDir
  const declarations = compile([input], {
    ...compilerOptions,
    emitDeclarationOnly: true,
    declaration: true,
    outFile,
    rootDir,
  })

  // console.log('decl', declarations)

  if (strategy === 'merge') {
    // apply dts merge
    return {}
  }

  if (strategy === 'bundle') {
    // generate pkg related links
    const result = patchDtsBundle(declarations[outFile as any])
    console.log(result)

    return {}
  }

  // fix extensions

  return {}
}

export const patchDtsBundle = (input: string, prefix = 'package-name', conceal = true) => {
  const declarations = parseBundleDeclarations(input)
  const actualNames = declarations.map(d => d.name)
  const rootDir = findRoot(actualNames)
  const nameMap = actualNames.reduce<Record<string, string>>((m, v) => {
    m[v] = conceal
      ? 'm' + Math.random().toString(16).slice(2)
      : prefix + '/' + v.slice(rootDir.length)
    return m
  }, {})

  return declarations.reduce((m, d) => {
    return m + `declare module "${nameMap[d.name]}" {
${patchModuleDeclarationRefs(d.contents, nameMap)}`
  }, '')
}

export const patchModuleDeclarationRefs = (contents: string, nameMap: Record<string, string>) => {

  const deps = depseekSync(contents)
  console.log('deps', deps)
  let pos = 0
  let _contents = ''

  for (const {index, value} of deps) {
    const _value = nameMap[value] || value

    _contents = _contents + contents.slice(pos, index) + _value
    pos = index + value.length
  }
  return _contents + contents.slice(pos)
}

export const assembleDtsBundle = () => {}

export const patchExtensions = () => {}

export const normalizeOpts = (opts?: Partial<TOptions>): TOptions => ({
  input: './index.ts',
  output: './index.d.ts',
  tsconfig: './tsconfig.json',
  strategy: 'separate',
  compilerOptions: {},
  temp: tempy(),
  ...opts
})

const tempy = (): string => fs.mkdtempSync(path.join(os.tmpdir(), 'tsc-dts-fix-'))

export const parseBundleDeclarations = (input: string): {name: string, contents: string}[] => {
  const lines = input.split('\n')
  const declarations: {name: string, contents: string}[] = []

  let declaration
  for (const line of lines) {
    if (line.startsWith('declare module')) {
      if (declaration) declarations.push(declaration)
      declaration = {name: line.slice(16, -3), contents: ''}
      continue
    }
    if (declaration) declaration.contents += line + '\n'
  }

  return declarations
}

// https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#getting-the-dts-from-a-javascript-file
const memo: Record<string, string> = {}
export const compile =(fileNames: string[], options: ts.CompilerOptions) => {
  const n = Date.now()
  // Create a Program with an in-memory emit
  const createdFiles: Record<string, string> = {}
  const host = ts.createCompilerHost(options)
  host.writeFile = (fileName: string, contents: string) => createdFiles[fileName] = contents
  // host.readFile = (fileName: string) => {
  //   if (memo[fileName]) return memo[fileName]
  //
  //
  //   // console.log('name', fileName)
  //   return fs.readFileSync(fileName, 'utf8')
  // }

  // Prepare and emit the d.ts files
  const program = ts.createProgram(fileNames, options, host);
  program.emit()

  console.log('compile time', Date.now() - n)
  return createdFiles
}

const findRoot = (files: string[]) =>
  files[0].slice(0, [...(files[0])].findIndex((c, i) => files.some(f => f.charAt(i) !== c)))
