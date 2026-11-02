import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { swatchPattern, type SwatchSource } from './Swatch'

const seed = JSON.parse(
  readFileSync(
    fileURLToPath(new URL('../../../backend/internal/db/seed/techs.json', import.meta.url)),
    'utf8',
  ),
) as SwatchSource[]

describe('swatchPattern', () => {
  it('membaca 11 tech dari seed', () => {
    expect(seed).toHaveLength(11)
  })

  // AC-22: every tech gets its own swatch, including pairs with the same needs and generation
  it('11 tech menghasilkan 11 pola berbeda', () => {
    const patterns = seed.map((tech) => JSON.stringify(swatchPattern(tech)))
    expect(new Set(patterns).size).toBe(seed.length)
  })

  it('sama untuk key yang sama, jadi gambarnya stabil antar kunjungan', () => {
    for (const tech of seed) expect(swatchPattern(tech)).toEqual(swatchPattern({ ...tech }))
  })

  it('generasi kedua lebih rapat', () => {
    const first = swatchPattern({ key: 'x', generation: 1, needs: ['hot'] })
    const second = swatchPattern({ key: 'x', generation: 2, needs: ['hot'] })
    expect(second.pitch).toBeLessThan(first.pitch)
  })

  it.each([
    ['hot', 'porous'],
    ['shape', 'ribbed'],
    ['move', 'stretchy'],
    ['soft', 'lofty'],
    ['cold', 'backed'],
    ['layer', 'shelled'],
  ] as const)('kebutuhan %s memberi sifat %s', (need, flag) => {
    const pattern = swatchPattern({ key: 'x', generation: 1, needs: [need] })
    expect(pattern[flag]).toBe(true)
    const others = (['porous', 'ribbed', 'stretchy', 'lofty', 'backed', 'shelled'] as const).filter(
      (other) => other !== flag,
    )
    for (const other of others) expect(pattern[other]).toBe(false)
  })
})
