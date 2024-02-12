import { populate, populateSync } from '../../../target/esm/index.mjs'

const config = await populate({
  extends: ['./src/test/fixtures/extra-looped.json', './src/test/fixtures/extra1.json', '@fixtures/config-with-extends'],
})

// Deno uses import map, so we cannot declare both aliases for require and import api flows:
const extra = globalThis.Deno ? [] : ['@fixtures/config-with-extends']
const configSync = populateSync({
  extends: ['./src/test/fixtures/extra5.json', ...extra],
})

console.log('Smoke test: OK', config, configSync)
