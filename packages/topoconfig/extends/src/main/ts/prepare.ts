import {TPrepareCtx, TPrepareOpts, TPrepare, TVmap} from './interface.js'
import {getProps, getSeed} from './util.js'

export const prepare: TPrepare = <T = any>(value: T, {vmap, cwd, root, id}: TPrepareOpts<T> = {}): T =>
  _clone<T>({value, cwd, vmap, root, id})

const _vmap: TVmap = ({value}) => value

export const vmap = _vmap

export const _clone = <T = any>({
  value,
  memo =      new Map(),
  seed =      getSeed(value),
  vmap =      _vmap,
  prefix =    '',
  resource =  value,
  cwd =       process.cwd(),
  root =      cwd,
  id
}: TPrepareCtx<T>): T => seed
  ? getProps(value).reduce((m: any, k) => {
    const p = `${prefix}${k.toString()}`
    const v = vmap({
      value: (value as any)[k],
      key: k,
      prefix: p,
      resource,
      id,
      cwd,
      root
    })
    if (memo.has(v)) {
      m[k] = memo.get(v)
    } else {
      const _seed = getSeed(v)
      if (_seed) {
        memo.set(v, _seed)
        _clone({
          value: v,
          seed: _seed,
          prefix: `${p}.`,
          memo,
          vmap,
          resource,
          cwd,
          id,
          root
        })
        m[k] = _seed
      } else {
        m[k] = v
      }
    }

    return m
  }, seed)
  : value
