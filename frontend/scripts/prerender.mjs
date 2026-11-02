// Writes static HTML per public route after the client and SSR builds (NFR-12).
// Data sections render as loading skeletons and fill in after hydration, because
// the API is not reachable at build time.
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

const APP_OUTLET = '<!--app-outlet-->'
const HEAD_OUTLET = '<!--head-outlet-->'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const ssrDist = join(root, 'dist-ssr')

const template = await readFile(join(dist, 'index.html'), 'utf8')
if (!template.includes(APP_OUTLET) || !template.includes(HEAD_OUTLET)) {
  throw new Error('index.html hasil build kehilangan penanda outlet')
}

// Nginx serves this empty shell for /admin and unknown paths, which mount instead of hydrate.
await writeFile(join(dist, 'spa.html'), template)

const { render } = await import(pathToFileURL(join(ssrDist, 'entry-server.js')).href)

for (const route of ROUTES) {
  const page = await render(route)
  const html = template
    .replace(/<title>.*?<\/title>/, () => `<title>${page.title}</title>`)
    .replace(HEAD_OUTLET, () => page.headTags)
    .replace(APP_OUTLET, () => page.html)
  const target = route === '/' ? dist : join(dist, route)
  await mkdir(target, { recursive: true })
  await writeFile(join(target, 'index.html'), html)
  console.log(`prerender ${route}`)
}

await rm(ssrDist, { recursive: true, force: true })
