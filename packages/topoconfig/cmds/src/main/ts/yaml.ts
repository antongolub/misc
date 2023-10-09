import {load} from 'js-yaml'

export const yaml = (...chunks: string[]): any => {
  const data = chunks.join('')
  return load(data.startsWith('"') ? data.slice(1, -1): data)
}
