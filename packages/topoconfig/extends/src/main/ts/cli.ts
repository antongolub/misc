import process from 'node:process'
import url from 'node:url'
import fs from 'node:fs/promises'
import {populate} from './index.js'

const stdout = Symbol('stdout')

export const parseArgv = (argv = process.argv.slice(2)) => {
  const [config, _opts = '{}', output = stdout] = argv
  const opts = JSON.parse(_opts)

  return {config, opts, output}
}

export const run = async (argv?: string[], exit = process.exit) => {
  try {
    const {config, opts, output} = parseArgv(argv)
    const result = JSON.stringify(await populate(config, opts), null ,2)

    if (output === stdout) {
      process.stdout.write(result)
    } else {
      await fs.writeFile(output as string, result, 'utf-8')
    }

    exit(0)
  } catch (e) {
    console.error(e)
    exit(1)
  }
}

if (import.meta.url.startsWith('file:')) {
  const modulePath = url.fileURLToPath(import.meta.url)
  if (process.argv[1] === modulePath) {
    (async () => run())()
  }
}
