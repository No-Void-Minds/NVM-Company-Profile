// Writes static HTML per public route after the client and SSR builds (NFR-12).
// Data sections render as loading skeletons and fill in after hydration, because
// the API is not reachable at build time.
import { createHash } from 'node:crypto'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

// Keep in sync with publicRoutes in backend/internal/httpapi/public.go.
const ROUTES = [
  '/',
  '/brand',
  '/teknologi',
  '/produk',
  '/b2b',
  '/galeri',
  '/testimoni',
  '/size',
  '/kontak',
  '/privasi',
]

const HTML_LANG = '<html lang="id">'
const APP_OUTLET = '<!--app-outlet-->'
const HEAD_OUTLET = '<!--head-outlet-->'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrDist = join(root, 'dist-ssr')

const template = await readFile(join(dist, 'index.html'), 'utf8')
if (![APP_OUTLET, HEAD_OUTLET, HTML_LANG].every((marker) => template.includes(marker))) {
  throw new Error('index.html hasil build kehilangan penanda outlet')
}

// The CSP allows inline scripts by hash only, so a changed theme script would be
// blocked in production while working in dev. Fail the build instead.
const csp = await readFile(join(root, 'nginx-security-headers.conf'), 'utf8')
for (const [, body] of template.matchAll(/<script>([\s\S]*?)<\/script>/g)) {
  const hash = `'sha256-${createHash('sha256').update(body).digest('base64')}'`
  if (!csp.includes(hash)) {
    throw new Error(`hash skrip inline tidak ada di nginx-security-headers.conf: ${hash}`)
  }
}

// Nginx serves this empty shell for /admin and unknown paths, which mount instead of hydrate.
await writeFile(join(dist, 'spa.html'), template)

const { render } = await import(pathToFileURL(join(ssrDist, 'entry-server.js')).href)

// Every route twice: Indonesian at the root, English under /en (FR-117)
for (const prefix of ['', '/en']) {
  for (const route of ROUTES) {
    const url = prefix && route === '/' ? prefix : prefix + route
    const page = await render(url)
    const html = template
      .replace(HTML_LANG, () => `<html lang="${page.lang}">`)
      .replace(/<title>.*?<\/title>/, () => `<title>${page.title}</title>`)
      .replace(HEAD_OUTLET, () => page.headTags)
      .replace(APP_OUTLET, () => page.html)
    const target = url === '/' ? dist : join(dist, url)
    await mkdir(target, { recursive: true })
    await writeFile(join(target, 'index.html'), html)
    console.log(`prerender ${url}`)
  }
}

await rm(ssrDist, { recursive: true, force: true })
