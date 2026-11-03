const ORIGIN = 'https://site.invalid'
const PASSWORD_PAGE = /^\/(en\/)?password\/?$/

// Where the password page sends a visitor after login (FR-124). Only a path on this site
// is accepted, so a crafted ?next= link cannot forward someone to another site.
export function safeNext(raw: unknown, fallback: string): string {
  if (typeof raw !== 'string' || raw === '' || raw.length > 2000) return fallback
  // "//host" and "/\host" are read by browsers as another host
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  // Control characters such as tab or newline, and backslashes anywhere
  for (const char of raw) {
    const code = char.charCodeAt(0)
    if (code < 0x20 || code === 0x7f || char === '\\') return fallback
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
