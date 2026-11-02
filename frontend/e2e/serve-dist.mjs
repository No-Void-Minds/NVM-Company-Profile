// Serves dist/ the way frontend/nginx.conf does, for testing the production build
// on a laptop without Docker: same file fallback, same security headers, gzip.
import { createReadStream, readFileSync, statSync } from 'node:fs'
import { createServer, request } from 'node:http'
import { dirname, extname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createGzip } from 'node:zlib'

const port = Number(process.env.PORT ?? 4180)
const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dist = join(root, 'dist')
const backend = { host: '127.0.0.1', port: 8082 }

const securityHeaders = Object.fromEntries(
  [
    ...readFileSync(join(root, 'nginx-security-headers.conf'), 'utf8').matchAll(
      /^add_header (\S+) "(.*)" always;$/gm,
    ),
  ].map((match) => [match[1], match[2]]),
)
if (!securityHeaders['Content-Security-Policy']) throw new Error('CSP tidak terbaca dari nginx')

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
}
const COMPRESSIBLE = new Set(['.html', '.js', '.css'])
const PROXIED = /^\/(api|media)\/|^\/(sitemap\.xml|robots\.txt)$/

function isFile(path) {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

// Mirrors: try_files $uri $uri/index.html /spa.html
function resolve(pathname) {
  const clean = normalize(pathname).replace(/\\/g, '/')
  const candidates = [clean, join(clean, 'index.html')].map((p) => join(dist, p))
  return candidates.find(isFile) ?? join(dist, 'spa.html')
}

function cacheControl(pathname) {
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable'
  if (pathname.startsWith('/fonts/') || pathname === '/brand/nvm-logo.png') {
    return 'public, max-age=2592000'
  }
  return 'no-cache'
}

createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost')

  if (PROXIED.test(pathname)) {
    const upstream = request(
      { ...backend, path: req.url, method: req.method, headers: req.headers },
      (answer) => {
        res.writeHead(answer.statusCode, answer.headers)
        answer.pipe(res)
      },
    )
    upstream.on('error', () => {
      res.writeHead(502, { 'Content-Type': 'text/html' })
      res.end('<h1>502 Bad Gateway</h1>')
    })
    req.pipe(upstream)
    return
  }

  const file = resolve(pathname)
  const ext = extname(file)
  const headers = {
    ...securityHeaders,
    'Cache-Control': cacheControl(pathname),
    'Content-Type': TYPES[ext] ?? 'application/octet-stream',
  }
  if (COMPRESSIBLE.has(ext) && /\bgzip\b/.test(req.headers['accept-encoding'] ?? '')) {
    res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip' })
    createReadStream(file)
      .pipe(createGzip({ level: 5 }))
      .pipe(res)
    return
  }
  res.writeHead(200, headers)
  createReadStream(file).pipe(res)
}).listen(port, '127.0.0.1', () => console.log(`serve-dist di http://127.0.0.1:${port}`))
