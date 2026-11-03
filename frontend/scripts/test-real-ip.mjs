// Proves that nginx takes the visitor IP from CF-Connecting-IP only when the request comes
// from the compose gateway (the host side, where the Cloudflare Tunnel connects), and that
// the backend receives that address in X-Real-IP and X-Forwarded-For.
//
// Runs the real nginx.conf with a real nginx: NGINX_BIN=/path/to/nginx node scripts/test-real-ip.mjs
// 127.0.0.1 stands in for the gateway and 127.0.0.2 for a LAN client.
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { createServer, request } from 'node:http'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const repo = join(root, '..')
const GATEWAY = '127.0.0.1'
const LAN = '127.0.0.2'
const VISITOR = '203.0.113.7'
const NGINX_PORT = 18092

let failed = 0
function check(name, actual, expected) {
  const ok = actual === expected
  if (!ok) failed++
  console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${ok ? '' : `: dapat ${actual}, harus ${expected}`}`)
}

// Static: one gateway value everywhere, inside the subnet, and only it is trusted.
const conf = readFileSync(join(root, 'nginx.conf'), 'utf8')
const compose = readFileSync(join(repo, 'deploy', 'docker-compose.yml'), 'utf8')
const envExample = readFileSync(join(repo, 'deploy', '.env.example'), 'utf8')
const trusted = [...conf.matchAll(/^\s*set_real_ip_from\s+(\S+);/gm)].map((m) => m[1])
check('hanya satu set_real_ip_from', trusted.join(' '), '${COMPRO_GATEWAY_IP}')
check('real_ip_header', /^\s*real_ip_header CF-Connecting-IP;/m.test(conf), true)
const defaults = [...compose.matchAll(/\$\{COMPRO_GATEWAY_IP:-([^}]+)\}/g)].map((m) => m[1])
check(
  'compose memakai satu default gateway',
  new Set(defaults).size === 1 && defaults.length >= 2,
  true,
)
check(
  '.env.example sama dengan compose',
  envExample.match(/^COMPRO_GATEWAY_IP=(.+)$/m)?.[1],
  defaults[0],
)
const subnet = compose.match(/\$\{COMPRO_SUBNET:-([^}]+)\}/)?.[1] ?? ''
const [network, bits] = subnet.split('/')
const toInt = (ip) => ip.split('.').reduce((n, part) => n * 256 + Number(part), 0)
const mask = bits ? (0xffffffff << (32 - Number(bits))) >>> 0 : 0
check(
  'gateway di dalam subnet',
  (toInt(defaults[0] ?? '0.0.0.0') & mask) >>> 0 === (toInt(network) & mask) >>> 0,
  true,
)

// The gate subrequest must carry cookies only, never the request body (an inquiry form)
const gateBlock = conf.match(/location = \/_gate \{([^}]*)\}/)?.[1] ?? ''
check('gate: internal', /^\s*internal;/m.test(gateBlock), true)
check('gate: GET', /^\s*proxy_method GET;/m.test(gateBlock), true)
check('gate: body tidak diteruskan', /^\s*proxy_pass_request_body off;/m.test(gateBlock), true)
check(
  'gate: Content-Length kosong',
  /^\s*proxy_set_header Content-Length "";/m.test(gateBlock),
  true,
)
check('gate: ke /api/gate', /proxy_pass http:\/\/compro_backend\/api\/gate;/.test(gateBlock), true)

// The password page needs its tab icon while everything else is locked
const faviconBlock = conf.match(/location ~ \^\/\(favicon[^{]*\{([^}]*)\}/)?.[1] ?? ''
check('favicon: lokasi sendiri', faviconBlock !== '', true)
check('favicon: tanpa auth_request', /auth_request/.test(faviconBlock), false)
check('favicon: cache panjang', /Cache-Control "public, max-age=2592000"/.test(faviconBlock), true)

const nginx = process.env.NGINX_BIN
if (!nginx) {
  console.log('NGINX_BIN tidak diisi, uji perilaku dilewati')
  process.exit(failed ? 1 : 0)
}

// Upstream that echoes what nginx forwarded
const echo = createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json')
  res.end(
    JSON.stringify({
      realIp: req.headers['x-real-ip'],
      forwardedFor: req.headers['x-forwarded-for'],
    }),
  )
})
await new Promise((resolve) => echo.listen(0, '127.0.0.1', resolve))
const upstream = echo.address().port

// The same substitution the nginx image does with envsubst, plus local paths
const prefix = mkdtempSync(join(tmpdir(), 'real-ip-'))
for (const dir of ['logs', 'temp', 'html']) mkdirSync(join(prefix, dir))
copyFileSync(join(root, 'nginx-security-headers.conf'), join(prefix, 'security-headers.conf'))
const server = conf
  .replaceAll('${COMPRO_GATEWAY_IP}', GATEWAY)
  .replace('server backend:8082;', `server 127.0.0.1:${upstream};`)
  .replace('listen 80;', `listen ${NGINX_PORT};`)
  .replace(/root \/usr\/share\/nginx\/html;/, 'root html;')
  .replaceAll('/etc/nginx/security-headers.conf', 'security-headers.conf')
writeFileSync(
  join(prefix, 'nginx.conf'),
  `pid logs/nginx.pid;\nerror_log logs/error.log;\nevents {}\nhttp {\n  access_log off;\n${server}\n}\n`,
)

const run = (args) =>
  spawnSync(nginx, ['-p', `${prefix}/`, '-c', 'nginx.conf', ...args], { encoding: 'utf8' })
const tested = run(['-t'])
check('konfigurasi lolos nginx -t', tested.status, 0)
if (tested.status !== 0) console.log(tested.stderr)

// nginx on Windows stays in the foreground, so it is started without waiting
const { spawn } = await import('node:child_process')
const master = spawn(nginx, ['-p', `${prefix}/`, '-c', 'nginx.conf'], { stdio: 'ignore' })
await new Promise((resolve) => setTimeout(resolve, 800))

function get(from, headers) {
  return new Promise((resolve, reject) => {
    const req = request(
      { host: '127.0.0.1', port: NGINX_PORT, path: '/api/x', localAddress: from, headers },
      (res) => {
        let body = ''
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => resolve(JSON.parse(body)))
      },
    )
    req.on('error', reject)
    req.end()
  })
}

try {
  let seen = await get(GATEWAY, { 'CF-Connecting-IP': VISITOR })
  check('gateway + CF-Connecting-IP: X-Real-IP pengunjung', seen.realIp, VISITOR)
  check('gateway + CF-Connecting-IP: X-Forwarded-For pengunjung', seen.forwardedFor, VISITOR)

  seen = await get(GATEWAY, {})
  check('gateway tanpa header: alamat gateway', seen.realIp, GATEWAY)

  seen = await get(LAN, { 'CF-Connecting-IP': VISITOR })
  check('LAN + CF-Connecting-IP palsu: diabaikan', seen.realIp, LAN)
  check('LAN + CF-Connecting-IP palsu: X-Forwarded-For alamat LAN', seen.forwardedFor, LAN)

  seen = await get(LAN, { 'X-Forwarded-For': VISITOR, 'X-Real-IP': VISITOR })
  check('LAN + X-Forwarded-For palsu: ditimpa', seen.forwardedFor, LAN)
  check('LAN + X-Real-IP palsu: ditimpa', seen.realIp, LAN)
} finally {
  run(['-s', 'stop'])
  master.kill()
  echo.close()
  await new Promise((resolve) => setTimeout(resolve, 300))
  rmSync(prefix, { recursive: true, force: true })
}

console.log(failed ? `GAGAL: ${failed}` : 'semua lolos')
process.exit(failed ? 1 : 0)
