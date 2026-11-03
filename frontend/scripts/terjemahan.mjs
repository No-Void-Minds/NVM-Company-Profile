// Writes docs/terjemahan.md from the dictionaries and tech seeds, so the list the team
// reviews (FR-114) can never drift from what the site shows. With --check it only fails
// when the file is out of date, which check.sh relies on.
// Node strips the TypeScript types itself, the dictionaries need no build step.
import { readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const target = join(root, '..', 'docs', 'terjemahan.md')
const seedDir = join(root, '..', 'backend', 'internal', 'db', 'seed')

const { id } = await import(pathToFileURL(join(root, 'src', 'i18n', 'id.ts')).href)
const { en } = await import(pathToFileURL(join(root, 'src', 'i18n', 'en.ts')).href)

// Keys whose source text is the original English (store copy or SRS); the Indonesian is the translation.
const ENGLISH_SOURCE = [
  /^home\.lead$/,
  /^tech\.lead$/,
  /^needs\./,
  /^brand\.(statement|engineeredBody|stages\.)/,
  /^b2b\.(wholesale|collaboration)\.(audience|body|points)/,
  /^contact\.lead$/,
  /^contact\.topics\.\d+\.title$/,
]

// Functions are shown with their parameter names as placeholders.
function render(value) {
  if (typeof value !== 'function') return value
  const params = value
    .toString()
    .slice(value.toString().indexOf('(') + 1, value.toString().indexOf(')'))
    .split(',')
    .map((p) => p.trim().split(':')[0].trim())
    .filter(Boolean)
  return value(...params.map((p) => (p === 'sizes' ? [`{${p}}`] : `{${p}}`)))
}

function flatten(value, prefix, out) {
  if (value !== null && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      flatten(child, prefix ? `${prefix}.${key}` : key, out)
    }
  } else {
    out.push([prefix, render(value)])
  }
  return out
}

const cell = (text) => String(text).replace(/\|/g, '\\|').replace(/\n/g, ' ')

const enRows = new Map(flatten(en, '', []))
const sections = new Map()
for (const [key, idText] of flatten(id, '', [])) {
  const section = key.split('.')[0]
  if (!sections.has(section)) sections.set(section, [])
  const mark = ENGLISH_SOURCE.some((pattern) => pattern.test(key)) ? ' *' : ''
  sections.get(section).push(`| \`${key}\`${mark} | ${cell(enRows.get(key))} | ${cell(idText)} |`)
}

const lines = [
  '# Terjemahan',
  '',
  'Dibuat otomatis oleh `frontend/scripts/terjemahan.mjs` dari `frontend/src/i18n/id.ts`, `en.ts`, dan seed tech di `backend/internal/db/seed/`. Jangan diedit langsung: ubah sumbernya, lalu jalankan `node scripts/terjemahan.mjs` dari folder `frontend`.',
  '',
  'Kunci bertanda `*` berasal dari teks Inggris asli (teks toko atau SRS), kolom ID adalah terjemahannya. Kunci lain berasal dari teks Indonesia v1.1, kolom EN adalah terjemahannya. Nama tech, nama fit, slogan brand, dan label seperti On the rack tidak diterjemahkan.',
  '',
  'Tolong cek bahwa terjemahan setia dan tidak menambah klaim (FR-114).',
]

for (const [section, rows] of sections) {
  lines.push('', `## ${section}`, '', '| Kunci | Teks EN | Teks ID |', '|---|---|---|', ...rows)
}

// Tech copy comes from the seeds: techs.json is the English source, techs_id.json the translation.
const techs = JSON.parse(await readFile(join(seedDir, 'techs.json'), 'utf8'))
let techsId = null
try {
  techsId = JSON.parse(await readFile(join(seedDir, 'techs_id.json'), 'utf8'))
} catch {
  // Added in Sprint 14, the dictionaries alone are listed until then.
}
if (techsId) {
  lines.push('', '## tech (seed)', '', '| Kunci | Teks EN | Teks ID |', '|---|---|---|')
  for (const tech of techs) {
    const translated = techsId.find((t) => t.key === tech.key)
    for (const field of ['tagline', 'sub', 'description', 'chips']) {
      const enText = Array.isArray(tech[field]) ? tech[field].join(', ') : tech[field]
      const idValue = translated?.[field] ?? ''
      const idText = Array.isArray(idValue) ? idValue.join(', ') : idValue
      lines.push(`| \`${tech.key}.${field}\` * | ${cell(enText)} | ${cell(idText)} |`)
    }
  }
}

const output = `${lines.join('\n')}\n`

if (process.argv.includes('--check')) {
  const current = await readFile(target, 'utf8').catch(() => '')
  if (current !== output) {
    console.error('docs/terjemahan.md tidak sesuai kamus. Jalankan: node scripts/terjemahan.mjs')
    process.exit(1)
  }
} else {
  await writeFile(target, output)
  console.log(`terjemahan: ${target}`)
}
