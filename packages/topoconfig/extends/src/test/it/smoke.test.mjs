import { populate, populateSync } from '../../../target/esm/index.mjs'

const config = await populate({
  extends: ['./src/test/fixtures/extra-looped.json', './src/test/fixtures/extra1.json', '@fixtures/config-with-extends'],
})

const configSync = populateSync({
  extends: ['./src/test/fixtures/extra5.json', '@fixtures/config-with-extends'],
})

console.log('Smoke test: OK', config, configSync)
