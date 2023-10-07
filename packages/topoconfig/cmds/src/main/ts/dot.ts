import _dot from 'dot'

export const dot = (...chunks: any[]) => _dot.template(chunks.map(c => c === undefined ? '' : c).join(''))({})
