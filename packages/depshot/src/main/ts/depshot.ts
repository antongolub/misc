export type TDepshotEntry = {
  raw:      string
  line:     number
  pos:      number
  resolved: string
}

export type TDepshot = Record<string, TDepshotEntry[]>

export const depshot = (contents: string, location: string, depshot: TDepshot = {}): TDepshot => {
  const pattern = /((?:\s|^)import\s+|\s+from\s+|\W(?:import|require)\s*\()(["'])([^"']+)(["'])/g
  const lines = contents.split('\n')
  const entries = (depshot[location] = depshot[location] || [])

  for (const l in lines) {
    const line = lines[l]
    const match = pattern.exec(line)
    if (match) {
      const [, offset,, raw] = match
      const { index } = match
      const pos = index + offset.length
      const resolved = raw

      entries.push({
        raw,
        line: Number.parseInt(l),
        pos,
        resolved
      })
    }
  }

  return depshot
}

