// Same rule as content.ValidateShopeeURL in the backend (FR-136): empty, or https on
// shopee.co.id. The link is kept as typed, collection links need their query.
export const SHOPEE_HOST = 'shopee.co.id'

export function shopeeUrlError(raw: string): string {
  if (raw === '') return ''
  if (raw.length > 2048) return 'Link terlalu panjang.'
  // The URL parser reads a backslash as a slash, the backend does not
  if (/[\\\s]/.test(raw)) return 'Link tidak boleh memuat spasi atau backslash.'
  for (const char of raw) {
    const code = char.charCodeAt(0)
    if (code < 0x20 || code === 0x7f) return 'Link memuat karakter kontrol.'
  }
  if (!raw.startsWith('https://')) return 'Link harus diawali https://'
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return 'Link tidak bisa dibaca.'
  }
  // The parser lowercases the host, so the raw text is checked as well
  const typedHost = raw.slice('https://'.length).split(/[/?#]/, 1)[0]
  if (url.username || url.password || url.port || typedHost !== SHOPEE_HOST) {
    return `Link harus ke ${SHOPEE_HOST}.`
  }
  return ''
}
