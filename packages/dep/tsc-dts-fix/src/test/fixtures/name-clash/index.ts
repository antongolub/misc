import type { Readable } from "node:stream"

export * from './a.ts'
export * from './b.ts'
export * from './c.ts'
export * from './d.ts'
export * from './e.ts'

export type ReadablePlus = Readable & {plus: string}