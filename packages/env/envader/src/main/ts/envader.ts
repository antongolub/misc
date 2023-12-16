import * as process from 'node:process'

export const envader = {
  set(key: string, value: string, limit = 1000): void {
    this.del(key)

    const index = getIndex()
    const id = getId()
    const len = Math.ceil(value.length / limit)
    let i = 0

    while (i < len) {
      process.env[`${id}_${i}`] = value.slice(i * limit, (i + 1) * limit)
      i++
    }

    index[key] = id
    storeIndex(index)
  },
  get(key: string): string | undefined {
    const index = getIndex()
    const id = index[key]

    if (!id) return

    return Object.entries(process.env)
      .reduce<string[]>((m, [k, v]) => {
        if (!k.startsWith(id)) return m

        const [, i] = k.split('_')
        m[+i] = v || ''

        return m
      }, [])
      .join('')
  },
  has(key: string): boolean {
    return !!getIndex()[key]
  },
  del(key: string): void {
    const index = getIndex()
    const id = index[key]
    if (!id) return

    Object.keys(process.env).forEach(k => {
      if (k.startsWith(id)) {
        delete process.env[k]
      }
    })
    index[key] = undefined

    storeIndex(index)
  },
  refs(): string[] {
    const index = getIndex()
    const ids = Object.values(index).filter(Boolean) as string[]
    const refs = Object.keys(process.env)
      .filter(k => ids.some(id => k.startsWith(id)))

    refs.push('ENVADER_INDEX')

    return refs
  }
}

type TIndex = Record<string, string | undefined>

const getId = () => Math.random().toString(36).slice(2, 10).toUpperCase()
const getIndex = (): TIndex => JSON.parse(process.env['ENVADER_INDEX'] || "{}")
const storeIndex = (index: TIndex): void => { process.env['ENVADER_INDEX'] = JSON.stringify(index) }
