import { populateSync } from '../../../target/esm/index.mjs'

const config = populateSync({
  extends: './src/test/fixtures/extra-looped.json',
})

console.log('Smoke test: OK', config)
