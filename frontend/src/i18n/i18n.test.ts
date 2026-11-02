import { describe, expect, it } from 'vitest'
import { en } from './en'
import { id } from './id'
import { basePath, langFromPath, localePath } from './index'

type Entry = [string, unknown]

function flatten(value: unknown, prefix = ''): Entry[] {
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) =>
      flatten(child, prefix ? `${prefix}.${key}` : key),
    )
  }
  return [[prefix, value]]
}

const idEntries = new Map(flatten(id))
const enEntries = new Map(flatten(en))

// vue-tsc already rejects a missing key (AC-20). This catches what types cannot:
// empty strings, and arrays such as the brand stages that differ in length.
describe('kamus', () => {
  it('en punya kunci yang sama persis dengan id', () => {
    expect([...enEntries.keys()].sort()).toEqual([...idEntries.keys()].sort())
  })

  it('tidak ada teks kosong', () => {
    for (const [key, value] of [...idEntries, ...enEntries]) {
      if (typeof value === 'string') expect(value.trim(), key).not.toBe('')
    }
  })

  it('fungsi di kedua kamus menerima argumen yang sama', () => {
    for (const [key, value] of idEntries) {
      if (typeof value === 'function') {
        expect((enEntries.get(key) as () => string).length, key).toBe(value.length)
      }
    }
  })
})

describe('path bahasa', () => {
  it.each([
    ['/', 'id', '/', '/en'],
    ['/teknologi', 'id', '/teknologi', '/en/teknologi'],
    ['/en', 'en', '/', '/en'],
    ['/en/teknologi', 'en', '/teknologi', '/en/teknologi'],
    // A word that only starts with "en" is still Indonesian
    ['/enak', 'id', '/enak', '/en/enak'],
  ])('%s', (path, lang, base, english) => {
    expect(langFromPath(path)).toBe(lang)
    expect(basePath(path)).toBe(base)
    expect(localePath(path, 'id')).toBe(base)
    expect(localePath(path, 'en')).toBe(english)
  })
})
