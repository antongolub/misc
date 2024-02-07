import { populate, populateSync } from '../../../target/esm/index.mjs'

const config = await populate({
  extends: ['./src/test/fixtures/extra-looped.json', './src/test/fixtures/extra1.json'],
})

const configSync = populateSync({
  extends: ['./src/test/fixtures/extra5.json'],
})

console.log('Smoke test: OK', config, configSync)
