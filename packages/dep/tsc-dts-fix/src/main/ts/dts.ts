import path from 'node:path'
import { patchRefs } from 'depseek'
import ts from 'typescript'

export type TDeclarations = {name: string, contents: string}[]

export type TOptions = {
  input: string
  output: string
  tsconfig: string
  compilerOptions: ts.CompilerOptions,
  strategy: 'separate' | 'bundle' | 'merge'
  ext: string
  // force node prefix
  // shake
}

const log = (any: any) => {console.log(any); return any}

export const generateDts = (opts?: Partial<TOptions>): string => {
  const {output, input, compilerOptions, strategy} = normalizeOpts(opts)
  const outFile = strategy === 'bundle' ? 'bundle.d.ts' : undefined
  const rootDir = compilerOptions.rootDir ?? '../'.repeat(100)
  const declarations = compile([input], {
    ...compilerOptions,
    emitDeclarationOnly: true,
    declaration: true,
    outFile,
    rootDir,
  })

  if (strategy === 'merge') {
    return log(buildDtsBundle(declarations))
  }

  if (strategy === 'bundle') {
    return patchDtsBundle({
      ...parseBundleDeclarations(declarations[0].contents),
      conceal: false,
    })
  }

  throw new Error(`Unknown strategy: ${strategy}`)
}

export const buildDtsBundle = (declarations: TDeclarations) => {
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

  return patchDtsBundle({
    directives,
    declarations: _declarations,
    conceal: false,
  })
}

// https://blog.logrocket.com/common-typescript-module-problems-how-to-solve/#solution-locating-module-resolve-imports
// https://typescript-v2-121.ortam.vercel.app/docs/handbook/module-resolution.html
export const patchDtsBundle = (opts: {directives: Set<string>, prefix?: string, conceal?: boolean, ext?: string, declarations: TDeclarations}) => {
  const {
    prefix = 'package-name',
    conceal = true,
    ext,
    declarations,
    directives
  } = opts
  const banner = directives.size ? [...directives, ''].join('\n') : ''
  const nameMap = getNameMap(declarations, prefix, conceal, ext)

  return declarations.reduce((m, d) =>
    m + `declare module "${nameMap[d.name]}" {
${patchRefs(d.contents, v => patchLocation(v, nameMap, d.name))}
}
`,
    banner)
}

export const getNameMap = (declarations: TDeclarations, prefix = 'package-name', conceal = true, ext?: string) => {
  const actualNames = declarations.map(d => d.name)
  const rootDir = findRoot(actualNames)

  return actualNames.reduce<Record<string, string>>((m, v) => {
    m[v] = conceal
      ? 'm' + Math.random().toString(16).slice(2)
      : prefix + '/' + patchExt(v.slice(rootDir.length), ext)
    return m
  }, {})
}

export const patchExt = (value: string, _ext?: string) => {
  const {ext} = path.parse(value)
  return (ext ? value.slice(0, -ext.length) : value) + (_ext ?? ext)
}

export const patchLocation = (value: string, nameMap: Record<string, string>, name: string) => {
  const _value = value.startsWith('.')
    ? path.resolve(path.dirname(name), trimExt(value))
    : value

  return nameMap[_value] || _value
}

const trimExt = (value: string) => {
  const {ext} = path.parse(value)
  return ext ? value.slice(0, -ext.length) : value
}

export const normalizeOpts = (opts?: Partial<TOptions>): TOptions => ({
  input: './index.ts',
  output: './index.d.ts',
  tsconfig: './tsconfig.json',
  strategy: 'separate',
  compilerOptions: {},
  ext: '',
  ...opts
})

export const parseBundleDeclarations = (input: string): {
  declarations: TDeclarations
  directives: Set<string>
} => {
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

  return {declarations, directives}
}

// https://github.com/Microsoft/TypeScript/wiki/Using-the-Compiler-API#getting-the-dts-from-a-javascript-file
const memo: Record<string, string> = {}
export const compile =(fileNames: string[], options: ts.CompilerOptions): TDeclarations => {
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
  return Object.entries(createdFiles)
    .map(([name, contents]) => ({name, contents}))
}

const findRoot = (files: string[]) =>
  files[0].slice(0, [...(files[0])].findIndex((c, i) => files.some(f => f.charAt(i) !== c)))

const fixLines = (lines: string[]): string[] => lines.map(l => fixLine(l))

const fixLine = (l: string) => fixTabs(fixShebang(fixExportDeclare(l)))

const fixTabs = (l: string, symbol = '  ', n = 2): string => `${symbol.repeat(n)}${l}`

const fixExportDeclare = (l: string): string => l.startsWith('export declare ') ? `export ${l.slice(15)}`: l

const fixShebang = (l: string): string => l.startsWith('#!') ? '' : l

