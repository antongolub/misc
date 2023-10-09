import minimist from 'minimist'
import * as process from 'node:process'

export const argv = (...args: any[]) => minimist(args.length === 0 ? process.argv.slice(2): args)
