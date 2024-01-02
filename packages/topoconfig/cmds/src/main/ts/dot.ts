import * as _dot from 'dot'

const _d = _dot?.default ?? _dot
export const dot = (...chunks: any[]) => _d.template(chunks.map(c => c === undefined ? '' : c).join(''))({})
