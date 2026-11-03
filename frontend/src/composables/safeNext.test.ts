import { describe, expect, it } from 'vitest'
import { safeNext } from './safeNext'

describe('safeNext', () => {
  it.each([
    ['/teknologi', '/teknologi'],
    ['/en/teknologi#lab-aezy', '/en/teknologi#lab-aezy'],
    ['/size?tech=aezy&fit=Regular', '/size?tech=aezy&fit=Regular'],
    ['/', '/'],
    // Ordinary encoding inside a path or query is still a path on this site
    ['/size?tech=curflex&fit=Mini%20Fitted', '/size?tech=curflex&fit=Mini%20Fitted'],
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
    ['backslash setelah garis miring', '/\\evil.com'],
    ['dua backslash', '\\\\evil.com'],
    ['backslash ter-encode', '/%5Cevil.com'],
    ['backslash ter-encode huruf kecil', '/%5cevil.com'],
    ['dua garis miring ter-encode', '/%2F%2Fevil.com'],
    ['campuran ter-encode', '/%2F%5Cevil.com'],
    ['garis miring ter-encode di awal', '%2F%2Fevil.com'],
    ['encode ganda', '/%252F%252Fevil.com'],
    ['tab ter-encode', '/%09/evil.com'],
    ['null ter-encode', '/%00evil'],
    ['encode rusak', '/%E0%A4%A'],
    ['halaman password', '/password'],
    ['halaman password en', '/en/password?next=/x'],
  ])('menolak %s', (_, raw) => {
    expect(safeNext(raw, '/fallback')).toBe('/fallback')
  })
})
