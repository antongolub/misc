import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import { parse, stringify } from '../../main/ts'

describe('parse/stringify', () => {
  it('works', () => {
    const str = `SIMPLE=xyz123
# comment ###
NON_INTERPOLATED='raw text without variable interpolation' 
MULTILINE = """
long text here, # not-comment
e.g. a private SSH key
"""
ENV=v1\nENV2=v2\n\n\n\t\t  ENV3  =    'v"3'   \n   export ENV4="v\`4"
ENV5="v'5" # comment
`
    const env = parse(str)
    assert.deepEqual(env, {
      SIMPLE: 'xyz123',
      NON_INTERPOLATED: 'raw text without variable interpolation',
      MULTILINE: 'long text here, # not-comment\ne.g. a private SSH key',
      ENV: 'v1',
      ENV2: 'v2',
      ENV3: 'v"3',
      ENV4: 'v`4',
      ENV5: "v'5",
    })

    const nstr = stringify(env)
    assert.equal(nstr, `SIMPLE=xyz123
NON_INTERPOLATED="raw text without variable interpolation"
MULTILINE="long text here, # not-comment\ne.g. a private SSH key"
ENV=v1
ENV2=v2
ENV3='v"3'
ENV4="v\`4"
ENV5="v'5"`)
  })
})
