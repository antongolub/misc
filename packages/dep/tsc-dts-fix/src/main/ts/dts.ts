import path from 'node:path'
import { patchRefs } from 'depseek'
import ts from 'typescript'

export type TDeclarations = {name: string, contents: string}[]

export type TAssets = {
  declarations: TDeclarations
  directives: Set<string>
}

export type TOptionsNormalized = {
  input: string[]
  compilerOptions: ts.CompilerOptions,
  strategy: 'separate' | 'bundle' | 'merge'
  ext: string
  pkgName: string
  entryPoints: Record<string, string>
  conceal: boolean
  // force node prefix
  // shake
}

export type TOptions = Partial<Omit<TOptionsNormalized, 'input'> & {input: string | string[]}>

export const normalizeOpts = (opts: TOptions = {}): TOptionsNormalized => ({
  strategy: 'separate',
  compilerOptions: {},
  ext: '',
  pkgName: 'package-name',
  conceal: false,
  entryPoints: {
    '.': './index.ts'
  },
  ...opts,
  input: [opts.input ?? './index.ts'].flat(),
})

export const generateDts = (opts?: TOptions): Record<string, string> => {
  const _opts = normalizeOpts(opts)
  const {input, compilerOptions, strategy} = _opts
  const outFile = strategy === 'bundle' ? 'bundle.d.ts' : undefined
  const rootDir = compilerOptions.rootDir ?? '../'.repeat(100)
  const declarations = compile([input].flat(), {
    ...compilerOptions,
    emitDeclarationOnly: true,
    declaration: true,
    outFile,
    rootDir,
  })

  if (strategy === 'merge') {
    return {[outFile!]: formatDtsBundle(parseDtsChunks(declarations), _opts)}
  }

  if (strategy === 'bundle') {
    return {[outFile!]: formatDtsBundle(parseDtsBundle(declarations[0].contents), _opts)}
  }

  if (strategy === 'separate') {
    return Object.fromEntries(patchDeclarationsExt(declarations, _opts.ext)
      .map(({name, contents}) => [name, contents]))
  }

  throw new Error(`Unknown strategy: ${strategy}`)
}

export const parseDtsBundle = (input: string): TAssets => {
  let declaration: {name: string, contents: string} | null = null
  const lines = input.split('\n')
  const declarations: {name: string, contents: string}[] = []
  const directives: Set<string> = new Set()
  const capture = () => {
    if (declaration) {
      declaration.contents = declaration.contents.slice(0, -1) // trim last \n
      declarations.push(declaration)
      declaration = null
    }
  }

  for (const line of lines) {
    if (line.startsWith('/// <reference')) {
      directives.add(line)
    }
    else if (line[0] === '}') {
      capture()
    }
    else if (line.startsWith('declare module')) {
      declaration = {name: line.slice(16, -3), contents: ''}
    }
    else if (declaration) declaration.contents += line + '\n'
  }

  return { declarations, directives }
}

export const parseDtsChunks = (declarations: TDeclarations): TAssets => {
  // Gathers triple-slash directives
  // https://www.typescriptlang.org/docs/handbook/triple-slash-directives.html
  const directives: Set<string> = new Set()
  const _declarations = declarations
    .map<TDeclarations[number]>(({name, contents}) => {
      const lines = contents
        .trim().split('\n')
        .filter(l => {
          if (l.startsWith('/// <reference')) {
            directives.add(l)
            return false
          }
          return true
        })

      return ({
        name: name.slice(0, -5),
        contents: fixLines(lines).join('\n')
      })
    })

  return {
    declarations: _declarations,
    directives
  }
}

export const patchDeclarationsExt = (declarations: TDeclarations, ext?: string): TDeclarations => {
  const actualNames = declarations.map(d => d.name)
  const rootDir = findRoot(actualNames)

  return declarations.map(({name, contents}) => ({
    name: name.slice(rootDir.length),
    contents: patchRefs(contents, v => v.startsWith('.') ? patchExt(v, ext) : v)
  }))
}

// https://blog.logrocket.com/common-typescript-module-problems-how-to-solve/#solution-locating-module-resolve-imports
// https://typescript-v2-121.ortam.vercel.app/docs/handbook/module-resolution.html
export const formatDtsBundle = ({declarations, directives}: TAssets, opts: TOptionsNormalized) => {
  const banner = directives.size ? [...directives, ''].join('\n') : ''
  const namesMap = getNamesMap(declarations, opts)
  const entryPointsDeclarations = genEntryPointsDeclarations(namesMap, opts)
  const patchedDeclarations = patchModuleDeclarations(declarations, namesMap)

  return banner + [...patchedDeclarations, ...entryPointsDeclarations].map(formatModuleDeclaration).join('\n')
}

export const patchModuleDeclarations = (declarations: TDeclarations, namesMap: Record<string, string>) =>
  declarations.map(({name, contents}) => ({
    name: namesMap[name],
    contents: patchRefs(contents, v => patchLocation(v, namesMap, name))
  }))

export const genEntryPointsDeclarations = (namesMap: Record<string, string>, opts: TOptionsNormalized) => {
  const {entryPoints, pkgName, ext} = opts
  return Object.entries(entryPoints).map(([entry, ref]) =>
    ({
      name: path.join(pkgName, entry),
      contents: `    export * from "${namesMap[log(patchExt(path.join(namesMap._root, ref), ''))]}"`
    })
  )
}

export const formatModuleDeclaration = ({name, contents}: TDeclarations[number]) =>
  `declare module "${name}" {
${contents}
}`

export const getNamesMap = (declarations: TDeclarations, opts: TOptionsNormalized) => {
  const {conceal, ext, pkgName} = opts
  const actualNames = declarations.map(d => d.name)
  const rootDir = findRoot(actualNames)

  return actualNames.reduce<Record<string, string>>((m, v) => {
    m[v] = conceal
      ? 'm' + Math.random().toString(16).slice(2)
      : path.join(pkgName, patchExt(v.slice(rootDir.length), ext))
    return m
  }, {_root: rootDir})
}

const trimExt = (value: string) => {
  const {ext} = path.parse(value)
  return ext ? value.slice(0, -ext.length) : value
}

export const patchExt = (value: string, _ext?: string) =>
  _ext === undefined
    ? value
    : trimExt(value) + _ext

export const patchLocation = (value: string, nameMap: Record<string, string>, name: string) => {
  const _value = value.startsWith('.')
    ? path.join(path.dirname(name), trimExt(value))
    : value

  return nameMap[_value] || _value
}

// https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#getting-the-dts-from-a-javascript-file
export const compile =(fileNames: string[], options: ts.CompilerOptions): TDeclarations => {
  const n = Date.now()
  const createdFiles: Record<string, string> = {}
  const host = ts.createCompilerHost(options)
  host.writeFile = (fileName: string, contents: string) => createdFiles[fileName] = contents

  const program = ts.createProgram(fileNames, options, host);
  program.emit()

  console.log('compile time', Date.now() - n)
  return Object.entries(createdFiles)
    .map(([name, contents]) => ({name, contents}))
}

const findRoot = (files: string[]) =>
  files[0].slice(0, [...(files[0])].findIndex((c, i) => files.some(f => f.charAt(i) !== c)))

const fixLines = (lines: string[]): string[] => lines.map(fixLine)

const fixLine = (l: string) => fixTabs(fixShebang(fixExportDeclare(l)))

const fixTabs = (l: string, symbol = '  ', n = 2): string => `${symbol.repeat(n)}${l}`

const fixExportDeclare = (l: string): string => l.startsWith('export declare ') ? `export ${l.slice(15)}`: l

const fixShebang = (l: string): string => l.startsWith('#!') ? '' : l

const log = (any: any) => {console.log(any); return any}
