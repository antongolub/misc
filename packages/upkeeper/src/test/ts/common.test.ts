import * as assert from 'node:assert'
import { describe, it } from 'node:test'
import * as path from 'node:path'
import * as fs from 'node:fs/promises'
import * as os from 'node:os'

import {applyScript, getPatch, gitDiff} from '../../main/ts/common'
import {spawn} from '../../main/ts/util'

describe('`gitDiff`', () => {
  it('returns a git diff', async () => {
    const patch = await gitDiff('my first string', 'my second string', 'myfile.txt')
    assert.equal(`diff --git a/myfile.txt b/myfile.txt
--- a/myfile.txt
+++ b/myfile.txt
@@ -1 +1 @@
-my first string
+my second string
`, patch)
  })

})

describe('`getPatch`', () => {
  it('generates a git patch', async () => {
    const script = await getPatch('my first string', 'my second string', 'myfile.txt', 'git')
    assert.equal(script, "echo $'diff --git a/myfile.txt b/myfile.txt\\n--- a/myfile.txt\\n+++ b/myfile.txt\\n@@ -1 +1 @@\\n-my first string\\n+my second string\\n' | git apply -C0 --inaccurate-eof --whitespace=fix")
  })

  it('generates a sed patch', async () => {
    const script = await getPatch('my first string', 'my second string', 'myfile.txt', 'sed')
    assert.equal(script, "sed -i '' '1s/.*/my second string/' myfile.txt")
  })
})

describe('`applyScript`', () => {
  it('applies a patch script', async () => {
    const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'tempy-'))
    const file = 'myfile.txt'
    const script = await getPatch('my first string', 'my second string', file)

    await spawn('git', ['init'], {cwd, shell: true, silent: true})
    await fs.writeFile(path.join(cwd, file), 'my first string', 'utf8')
    await applyScript(script, cwd)

    const contents = await fs.readFile(path.join(cwd, file), 'utf8')
    assert.equal(contents, 'my second string')
  })
})
