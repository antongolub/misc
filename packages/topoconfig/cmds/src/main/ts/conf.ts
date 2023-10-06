import Conf from 'conf'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const tempy = () => fs.mkdtempSync(path.join(os.tmpdir(), 'tempy-'))

export const conf = (data: any, schema?: Record<string, any>, opts?: ConstructorParameters<typeof Conf>[0]): Conf =>
  new Conf({defaults: data, schema, cwd: tempy(), ...opts})
