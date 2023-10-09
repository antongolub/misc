import fs from 'node:fs/promises'

export const file = (name: string, opts: any = 'utf8') => fs.readFile(name, opts)
