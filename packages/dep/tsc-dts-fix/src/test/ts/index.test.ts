import * as assert from 'node:assert'
import * as path from 'node:path'
import { describe, it } from 'node:test'
import { fileURLToPath } from 'node:url'
import { generateDts, patchExt } from '../../main/ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.resolve(__dirname, '../fixtures')
const checkLineByLine = (a: string, b: string) => {
  const c1: string[] = a.trim().replaceAll("'", '"').split('\n')
  const c2: string[] = b.trim().replaceAll("'", '"').split('\n')
  for (let i in c1) {
    assert.ok(c1[i] === c2[i], `${c1[i]} !== ${c2[i]}, index: ${i}`)
  }
}

describe('generateDts()', () => {
  const expected = `/// <reference types="node" />
declare module "package-name/depseek" {
    export const foo = "bar";
}
declare module "package-name/a" {
    export * from "package-name/depseek";
}
declare module "package-name/b" {
    export * from 'depseek';
}
declare module "package-name/c" {
    export * from "package-name/depseek";
    export * from "depseek";
}
declare module "package-name/d" {
    export const seek: (opts: any) => void;
}
declare module "package-name/e" {
    export const seek2: (stream: string | import("stream").Readable, opts?: Partial<import("depseek").TOptsNormalized>) => Promise<import("depseek").TCodeRef[]>;
}
declare module "package-name/index" {
    import type { Readable } from "node:stream";
    export * from "package-name/a";
    export * from "package-name/b";
    export * from "package-name/c";
    export * from "package-name/d";
    export * from "package-name/e";
    export type ReadablePlus = Readable & {
        plus: string;
    };
}
`

  it('with `bundle` strategy', () => {
    assert.deepEqual(generateDts({
      input: path.resolve(fixtures, 'name-clash/index.ts'),
      strategy: 'bundle'
    }), expected)
  })

  it('with `merge` strategy', () => {
    checkLineByLine(
      generateDts({
        input: path.resolve(fixtures, 'name-clash/index.ts'),
        strategy: 'merge'
      }),
      expected
    )
  })
})

describe('patchExt()', () => {
  const cases: [string, string, string][] = [
    ['foo/bar/baz.js', '', 'foo/bar/baz'],
    ['foo/bar/baz.ts', '', 'foo/bar/baz'],
    ['foo/bar/baz.ts', '.js', 'foo/bar/baz.js'],
    ['foo/bar/baz', '.js', 'foo/bar/baz.js'],
  ]

  cases.forEach(([input, ext, result]) => it(`${input} + ${ext} = ${result}`, () => {
    assert.equal(patchExt(input, ext), result)
  }))
})
