import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import {fileURLToPath} from 'node:url'
import * as path from 'node:path'
import {generate, nameGens} from '../../main/ts/generator'
import {TKeeperCtx, TProposal} from '../../main/ts'
import {normalizeConfig} from '../../main/ts/config'
import {keeper as npm} from '../../main/ts/keepers/npm'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

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
      },
      flags: {}
    }
    const config = normalizeConfig({
      post: 'echo "updated {{=it.data.name}} to {{=it.data.version}}"',
    })
    await npm.script(ctx)

    const {scripts, proposals} = generate([ctx], config)
    const {contents, post} = scripts.find(({name}) => name === 'npm-update-package-json-emotion-css-11-2-0.sh')

    assert.ok(contents.includes('n+    "@emotion/css": "^11.2.0"'))
    assert.ok(post.includes('echo "updated @emotion/css to ^11.2.0"'))
  })
})

describe('nameGens', () => {
  it('generates script names', () => {
    const ctx: TKeeperCtx = {
      keeper: 'npm',
      cwd: '',
      resources: [],
      proposals: [],
      config: {
        cwd: '',
        resources: [],
        include: [],
        exclude: [],
      },
      flags: {}
    }
    const proposal: TProposal = {
      keeper: 'npm',
      action: 'update',
      resource: 'package.json',
      data: {
        name: '@emotion/css',
        version: '^11.2.0',
        scope: 'dependencies'
      }
    }

    assert.strictEqual(nameGens.proposal(ctx, proposal), 'npm-update-package-json-emotion-css-11-2-0.sh')
    assert.strictEqual(nameGens.same(ctx, proposal), 'npm-update-emotion-css-11-2-0.sh')
    assert.strictEqual(nameGens.resource(ctx, proposal), 'npm-update-package-json.sh')
    assert.strictEqual(nameGens['all-in'](ctx, proposal), 'npm-update.sh')
  })
})
