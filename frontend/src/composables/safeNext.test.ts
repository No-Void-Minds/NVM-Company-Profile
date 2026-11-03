import { describe, expect, it } from 'vitest'
import { safeNext } from './safeNext'

describe('safeNext', () => {
  it.each([
    ['/teknologi', '/teknologi'],
    ['/en/teknologi#lab-aezy', '/en/teknologi#lab-aezy'],
    ['/size?tech=aezy&fit=Regular', '/size?tech=aezy&fit=Regular'],
    ['/', '/'],
  ])('menerima path di situs ini: %s', (raw, expected) => {
    expect(safeNext(raw, '/fallback')).toBe(expected)
  })

  it.each([
    ['URL absolut', 'https://evil.example/curi'],
    ['URL absolut http', 'http://evil.example'],
    ['protokol relatif', '//evil.example/x'],
    ['garis miring terbalik', '/\\evil.example'],
    ['backslash di tengah', '/a\\..\\evil'],
    ['skema javascript', 'javascript:alert(1)'],
    ['skema data', 'data:text/html,hai'],
    ['tanpa garis miring awal', 'evil.example'],
    ['tab di dalam', '/\t/evil.example'],
    ['baris baru', '/x\nSet-Cookie: a'],
    ['kosong', ''],
    ['bukan string', ['/teknologi']],
    ['halaman password', '/password'],
    ['halaman password en', '/en/password?next=/x'],
  ])('menolak %s', (_, raw) => {
    expect(safeNext(raw, '/fallback')).toBe('/fallback')
  })
})
