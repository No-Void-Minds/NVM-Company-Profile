import { describe, expect, it } from 'vitest'
import {
  parseHeight,
  parseSizeChart,
  recommendByGarment,
  recommendByHeight,
  type ParsedChart,
} from './useSizeRecommendation'

// Same text as backend/internal/db/seed/sizecharts.json
const AEZY_REGULAR =
  'Size / Ukuran | Width / Lebar Badan | Length / Panjang Badan | Sleeve / Panjang Lengan | Height* / Tinggi Badan\n' +
  'S | 48 | 66 | 21 | < 160\n' +
  'M | 51 | 68.5 | 22 | 160-170\n' +
  'L | 54 | 71 | 23 | 170-180\n' +
  'XL | 57 | 73.5 | 24 | 180-190\n' +
  'XXL | 60 | 76 | 25 | > 190'

const chart = parseSizeChart(AEZY_REGULAR) as ParsedChart

describe('parseHeight', () => {
  it('reads every separator the charts use', () => {
    expect(parseHeight('< 160')).toEqual({ min: null, max: 160, exclusive: true })
    expect(parseHeight('> 190')).toEqual({ min: 190, max: null, exclusive: true })
    expect(parseHeight('160-170')).toEqual({ min: 160, max: 170, exclusive: false })
    expect(parseHeight('160–170')).toEqual({ min: 160, max: 170, exclusive: false })
    expect(parseHeight('160 - 170')).toEqual({ min: 160, max: 170, exclusive: false })
  })

  it('returns null for text it cannot read', () => {
    expect(parseHeight('')).toBeNull()
    expect(parseHeight('tinggi')).toBeNull()
  })
})

describe('parseSizeChart', () => {
  it('finds columns from the bilingual headers', () => {
    expect(chart.headers).toHaveLength(5)
    expect(chart.rows.map((r) => r.size)).toEqual(['S', 'M', 'L', 'XL', 'XXL'])
    // Sleeve also says "Panjang", it must not be taken for the length column.
    expect(chart.rows[1]).toMatchObject({ width: 51, length: 68.5 })
  })

  it('accepts CRLF and rejects a chart without size rows', () => {
    expect(parseSizeChart('Size | Width\r\nS | 48\r\n')?.rows).toHaveLength(1)
    expect(parseSizeChart('Size | Width')).toBeNull()
    expect(parseSizeChart('')).toBeNull()
  })
})

describe('recommendByHeight', () => {
  it('AC-04: height 172 marks L', () => {
    expect(recommendByHeight(chart, 172)).toMatchObject({ sizes: ['L'], between: false })
  })

  it('handles both open ended rows', () => {
    expect(recommendByHeight(chart, 159.5)?.sizes).toEqual(['S'])
    expect(recommendByHeight(chart, 195)?.sizes).toEqual(['XXL'])
  })

  it('FR-73: a shared boundary is between two sizes', () => {
    expect(recommendByHeight(chart, 170)).toMatchObject({ sizes: ['M', 'L'], between: true })
    expect(recommendByHeight(chart, 180)).toMatchObject({ sizes: ['L', 'XL'], between: true })
  })

  it('does not count open ended boundaries as a match', () => {
    expect(recommendByHeight(chart, 160)?.sizes).toEqual(['M'])
    expect(recommendByHeight(chart, 190)?.sizes).toEqual(['XL'])
  })

  it('a gap between ranges lands on both neighbours', () => {
    const gapped = parseSizeChart('Size | Height\nM | 160-169\nL | 170-179') as ParsedChart
    expect(recommendByHeight(gapped, 169.5)).toMatchObject({ sizes: ['M', 'L'], between: true })
  })

  it('FR-75: never guesses without height data', () => {
    const noHeight = parseSizeChart('Size | Width\nS | 48') as ParsedChart
    expect(recommendByHeight(noHeight, 170)).toBeNull()
    const closedRange = parseSizeChart('Size | Height\nM | 160-169') as ParsedChart
    expect(recommendByHeight(closedRange, 200)).toBeNull()
  })
})

describe('recommendByGarment', () => {
  it('AC-04: width 51 and length 69 marks M', () => {
    const result = recommendByGarment(chart, 51, 69)
    expect(result).toMatchObject({ sizes: ['M'], between: false })
    expect(result?.differences.M).toBe(0.5)
    expect(result?.differences.L).toBe(5)
  })

  it('FR-73: an exact tie is between two sizes', () => {
    expect(recommendByGarment(chart, 49.5, 67.25)).toMatchObject({
      sizes: ['S', 'M'],
      between: true,
    })
  })

  it('reports a difference for every size (FR-72)', () => {
    expect(Object.keys(recommendByGarment(chart, 51, 69)?.differences ?? {})).toEqual([
      'S',
      'M',
      'L',
      'XL',
      'XXL',
    ])
  })

  it('FR-75: never guesses without width and length', () => {
    const noWidth = parseSizeChart('Size | Height\nS | < 160') as ParsedChart
    expect(recommendByGarment(noWidth, 51, 69)).toBeNull()
  })
})
