import esprima from 'esprima'

export const getDeps = (input) => esprima.tokenize(input)

