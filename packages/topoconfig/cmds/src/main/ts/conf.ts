import * as _conf from 'conf'
import type Conf from 'conf'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

// eslint-disable-next-line
// @ts-ignore
const _Conf = _conf?.default ?? _conf
const tempy = () => fs.mkdtempSync(path.join(os.tmpdir(), 'tempy-'))

export const conf = (data: any, schema?: Record<string, any>, opts?: ConstructorParameters<typeof Conf>[0]): Conf =>
  new _Conf({defaults: data, schema, cwd: tempy(), ...opts})
