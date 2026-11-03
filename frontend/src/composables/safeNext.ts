const ORIGIN = 'https://site.invalid'
const PASSWORD_PAGE = /^\/(en\/)?password\/?$/
// Enough for double and triple encoding, which is all a browser or server would undo
const DECODE_ROUNDS = 3

// "//host" and "/\host" are read by browsers as another host. Control characters
// such as tab or newline are dropped by the URL parser, which can join "/" and "/".
function unsafe(text: string): boolean {
  if (text.startsWith('//') || text.startsWith('/\\')) return true
  for (const char of text) {
    const code = char.charCodeAt(0)
    if (code < 0x20 || code === 0x7f || char === '\\') return true
  }
  return false
}

// Where the password page sends a visitor after login (FR-124). Only a path on this site
// is accepted, so a crafted ?next= link cannot forward someone to another site.
export function safeNext(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string' || raw === '' || raw.length > 2000) return fallback
  if (!raw.startsWith('/')) return fallback

  // Every decoding of the value must be safe too, so /%5Cevil.com or /%252F%252Fevil.com
  // cannot turn into another host after the browser or a proxy decodes it.
  let layer = raw
  for (let round = 0; round <= DECODE_ROUNDS; round++) {
    if (unsafe(layer)) return fallback
    let decoded: string
    try {
      decoded = decodeURIComponent(layer)
    } catch {
      // Broken percent encoding has no single meaning, so it is refused
      return fallback
    }
    if (decoded === layer) break
    layer = decoded
  }

  let url: URL
  try {
    url = new URL(raw, ORIGIN)
  } catch {
    return fallback
  }
  if (url.origin !== ORIGIN) return fallback
  // Going back to the password page would only show the form again
  if (PASSWORD_PAGE.test(url.pathname)) return fallback
  return url.pathname + url.search + url.hash
}
