import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {fileURLToPath} from 'node:url'
import * as path from 'node:path'
import {upkeeper, generate} from '../../main/ts/upkeeper'
import {TKeeperCtx} from '../../main/ts'
import {normalizeConfig} from '../../main/ts/config'
import {keeper as npm} from '../../main/ts/keepers/npm'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

describe('upkeeper()', () => {
  it('generates proposals and scripts', async () => {
    const config = {
      keepers: [
        'npm'
      ],
      pre: 'echo "pre"',
      post: 'echo "post"',
      combine: true,
      dryrun: true
    }
    const {scripts, proposals} = await upkeeper(config)
    assert.ok(scripts.find(({name}) => name === 'upkeeper.sh'))
    // console.log(scripts, proposals)
  })
})

describe('generate()', () => {
  it('generates proposals and scripts', async () => {
    const cwd = path.resolve(__dirname, '../fixtures/mr')
    const ctx: TKeeperCtx = {
      keeper: 'npm',
      cwd,
      resources: [
        {
          name: 'package.json',
          contents: JSON.stringify({
            name: 'mr',
            dependencies: {
              '@emotion/css': '^11.0.0'
            }
          }, null, 2)
        }
      ],
      proposals: [{
        keeper: 'npm',
        action: 'update',
        resource: 'package.json',
        data: {
          name: '@emotion/css',
          version: '^11.2.0',
          scope: 'dependencies'
        }
      }],
      config: {
        cwd,
        resources: [],
        include: [],
        exclude: [],
      }
    }
    const config = normalizeConfig({
      pre: 'echo "updated {{=it.data.name}} to {{=it.data.version}}"',
    })
    await npm.script(ctx)

    const {scripts, proposals} = generate([ctx], config)
    const {contents} = scripts.find(({name}) => name === 'npm-update-package-json-emotion-css-11-2-0.sh')
    assert.ok(contents.includes('echo "updated @emotion/css to ^11.2.0"'))
  })
})
