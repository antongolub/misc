import DepsRegex from 'deps-regex'

const re = new DepsRegex({
  matchInternal: true,
  matchES6: true,
  matchCoffeescript: true,
})

export const getDeps = (input) => re.getDependencies(input)
