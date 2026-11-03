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
  '.ico': 'image/x-icon',
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

// Mirrors the auth_request locations in nginx.conf (FR-121)
const FAVICON = /^\/(favicon\.ico|favicon-32\.png|apple-touch-icon\.png|icon-(192|512)\.png)$/
const OPEN =
  /^\/(assets|fonts)\/|^\/brand\/nvm-logo\.png$|^\/admin|^\/api\/(health|gate)$|^\/api\/admin\/|^\/(sitemap\.xml|robots\.txt)$|^\/(en\/)?password(\/|\/index\.html)?$/
const GATED_API = /^\/(api|media)\//
const PASSWORD_PAGE = /^\/(en\/)?password(\/|\/index\.html)?$/

function checkGate(req) {
  return new Promise((resolve) => {
    const ask = request(
      {
        ...backend,
        path: '/api/gate',
        method: 'GET',
        headers: { cookie: req.headers.cookie ?? '' },
      },
      (answer) => {
        answer.resume()
        resolve({ status: answer.statusCode, state: answer.headers['x-gate'] })
      },
    )
    ask.on('error', () => resolve({ status: 500, state: 'on' }))
    ask.end()
  })
}

function cacheControl(pathname) {
  if (pathname.startsWith('/assets/')) return 'public, max-age=31536000, immutable'
  if (
    pathname.startsWith('/fonts/') ||
    pathname === '/brand/nvm-logo.png' ||
    FAVICON.test(pathname)
  ) {
    return 'public, max-age=2592000'
  }
  return 'no-cache'
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost')
  const locked = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' }
  let gate = { status: 204, state: 'off' }
  if (!OPEN.test(pathname) && !FAVICON.test(pathname)) {
    gate = await checkGate(req)
    if (gate.status === 401 && GATED_API.test(pathname)) {
      res.writeHead(401, { ...locked, 'Content-Type': 'application/json' })
      res.end('{"error":{"code":"UNAUTHORIZED","message":"Situs sedang dikunci."}}')
      return
    }
    if (gate.status === 401) {
      const page = /^\/en(\/|$)/.test(pathname) ? 'en/password/index.html' : 'password/index.html'
      res.writeHead(401, { ...securityHeaders, ...locked, 'Content-Type': TYPES['.html'] })
      createReadStream(join(dist, page)).pipe(res)
      return
    }
  }

  if (PROXIED.test(pathname)) {
    const upstream = request(
      { ...backend, path: req.url, method: req.method, headers: req.headers },
      (answer) => {
        res.writeHead(answer.statusCode, answer.headers)
        answer.pipe(res)
      },
    )
    upstream.on('error', () => {
      // The backend can drop mid-response (a restart between suites), headers are then gone
      if (res.headersSent) {
        res.destroy()
        return
      }
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
    // The password page and every page of a locked site stay out of caches and indexes
    ...(PASSWORD_PAGE.test(pathname) || gate.state === 'on' ? locked : {}),
  }
  if (pathname.startsWith('/admin')) {
    res.writeHead(200, { ...headers, 'Content-Type': TYPES['.html'] })
    createReadStream(join(dist, 'spa.html')).pipe(res)
    return
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
