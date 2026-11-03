// All size math lives here (FR-76). The size chart rows use the pipe format.

export interface HeightRange {
  min: number | null
  max: number | null
  // "< 160" and "> 190" leave out the boundary, "160-170" includes both ends.
  exclusive: boolean
}

export interface SizeRow {
  size: string
  cells: string[]
  width: number | null
  length: number | null
  height: HeightRange | null
}

export interface ParsedChart {
  headers: string[]
  rows: SizeRow[]
}

export interface SizeResult {
  sizes: string[]
  between: boolean
  // Sum of absolute width and length differences per size, garment mode only.
  differences: Record<string, number>
}

const TIE_EPSILON = 0.001

function parseNumber(value: string): number | null {
  const n = Number(value.trim().replace(',', '.'))
  return value.trim() !== '' && Number.isFinite(n) ? n : null
}

export function parseHeight(value: string): HeightRange | null {
  const text = value.trim()
  const below = text.match(/^<\s*([\d.,]+)/)
  if (below) {
    const max = parseNumber(below[1])
    return max === null ? null : { min: null, max, exclusive: true }
  }
  const above = text.match(/^>\s*([\d.,]+)/)
  if (above) {
    const min = parseNumber(above[1])
    return min === null ? null : { min, max: null, exclusive: true }
  }
  const range = text.match(/^([\d.,]+)\s*[-–]\s*([\d.,]+)$/)
  if (range) {
    const min = parseNumber(range[1])
    const max = parseNumber(range[2])
    return min === null || max === null ? null : { min, max, exclusive: false }
  }
  return null
}

export function parseSizeChart(rows: string): ParsedChart | null {
  const lines = rows
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split('|').map((cell) => cell.trim()))
  if (lines.length < 2) return null

  const headers = lines[0]
  const columnOf = (pattern: RegExp) => headers.findIndex((h) => pattern.test(h.toLowerCase()))
  const widthColumn = columnOf(/width|lebar/)
  const lengthColumn = columnOf(/length|panjang badan/)
  const heightColumn = columnOf(/height|tinggi/)

  return {
    headers,
    rows: lines.slice(1).map((cells) => ({
      size: cells[0],
      cells,
      width: widthColumn >= 0 ? parseNumber(cells[widthColumn] ?? '') : null,
      length: lengthColumn >= 0 ? parseNumber(cells[lengthColumn] ?? '') : null,
      height: heightColumn >= 0 ? parseHeight(cells[heightColumn] ?? '') : null,
    })),
  }
}

function heightMatches(range: HeightRange, height: number): boolean {
  if (range.exclusive) {
    if (range.max !== null) return height < range.max
    return range.min !== null && height > range.min
  }
  return height >= (range.min ?? -Infinity) && height <= (range.max ?? Infinity)
}

// A boundary such as 170 belongs to both M and L, which counts as between two sizes.
export function recommendByHeight(chart: ParsedChart, height: number): SizeResult | null {
  const rows = chart.rows.filter((row) => row.height)
  if (rows.length === 0) return null

  const hits = rows.filter((row) => heightMatches(row.height as HeightRange, height))
  if (hits.length > 0) {
    return { sizes: hits.map((row) => row.size), between: hits.length > 1, differences: {} }
  }

  // The chart may leave gaps, such as 160-169 then 170-179, so 169.5 sits between them.
  const lower = rows.filter((row) => row.height?.max !== null && (row.height?.max ?? 0) < height)
  const upper = rows.filter((row) => row.height?.min !== null && (row.height?.min ?? 0) > height)
  if (lower.length === 0 || upper.length === 0) return null
  return {
    sizes: [lower[lower.length - 1].size, upper[0].size],
    between: true,
    differences: {},
  }
}

export function recommendByGarment(
  chart: ParsedChart,
  width: number,
  length: number,
): SizeResult | null {
  const rows = chart.rows.filter((row) => row.width !== null && row.length !== null)
  if (rows.length === 0) return null

  const differences: Record<string, number> = {}
  for (const row of rows) {
    const total =
      Math.abs((row.width as number) - width) + Math.abs((row.length as number) - length)
    differences[row.size] = Math.round(total * 100) / 100
  }
  const smallest = Math.min(...Object.values(differences))
  const sizes = rows
    .filter((row) => Math.abs(differences[row.size] - smallest) < TIE_EPSILON)
    .map((row) => row.size)
  return { sizes, between: sizes.length > 1, differences }
}
