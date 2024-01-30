import type ts from 'typescript'

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
  outDir: string
  entryPoints: Record<string, string>
  conceal: boolean
  cwd: string
  declarations?: TDeclarations
  // force: boolean // node prefix
  // shake: boolean // tree shake redundant declarations
}

export type TOptions = Partial<Omit<TOptionsNormalized, 'input'> & {input: string | string[]}>
