// Builds the favicon set in public/ from brand-src/favicon-source.png. Run it again when
// the logo changes: node scripts/favicon.mjs
// sharp is installed into a temp folder on each run, so it never becomes a dependency.
import { execSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const SHARP = 'sharp@0.34.4'
// Tokens --fg and --bg of the light theme. A light logo sits on the dark one and the
// other way round, so the mark stays visible on both light and dark browser tabs.
const DARK = '#111317'
const LIGHT = '#F3F2EE'
// Share of the square the logo may fill, the rest is breathing room
const FILL = 0.8

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const source = join(root, 'brand-src', 'favicon-source.png')
const out = join(root, 'public')

const temp = mkdtempSync(join(tmpdir(), 'nvm-favicon-'))
try {
  execSync(`npm install --no-save --no-audit --no-fund --prefix "${temp}" ${SHARP}`, {
    stdio: 'inherit',
  })
  const sharp = createRequire(join(temp, 'package.json'))('sharp')
  await build(sharp)
} finally {
  try {
    rmSync(temp, { recursive: true, force: true })
  } catch {
    // Windows keeps sharp's native library locked until this process exits
    console.log(`folder sementara ${temp} bisa dihapus manual`)
  }
}

async function build(sharp) {
  const logo = sharp(source).ensureAlpha().trim({ threshold: 0 })
  const { data, info } = await logo.clone().raw().toBuffer({ resolveWithObject: true })
  const background = luminance(data) > 0.5 ? DARK : LIGHT
  console.log(`sumber ${info.width}x${info.height} setelah trim, latar ${background}`)
  const trimmed = await logo.png().toBuffer()

  async function square(size) {
    const inner = Math.round(size * FILL)
    const mark = await sharp(trimmed)
      .resize(inner, inner, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: 'lanczos3',
      })
      .toBuffer()
    return sharp({ create: { width: size, height: size, channels: 4, background } })
      .composite([{ input: mark, gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toBuffer()
  }

  const files = {
    'favicon-32.png': 32,
    'apple-touch-icon.png': 180,
    'icon-192.png': 192,
    'icon-512.png': 512,
  }
  for (const [name, size] of Object.entries(files)) {
    writeFileSync(join(out, name), await square(size))
  }
  writeFileSync(
    join(out, 'favicon.ico'),
    ico(await Promise.all([16, 32, 48].map(square)), [16, 32, 48]),
  )
  console.log(`favicon.ico, ${Object.keys(files).join(', ')} ditulis ke public/`)
}

// Mean brightness of the visible pixels, weighted by their opacity
function luminance(rgba) {
  let sum = 0
  let weight = 0
  for (let i = 0; i < rgba.length; i += 4) {
    const alpha = rgba[i + 3] / 255
    sum += ((0.2126 * rgba[i] + 0.7152 * rgba[i + 1] + 0.0722 * rgba[i + 2]) / 255) * alpha
    weight += alpha
  }
  return weight ? sum / weight : 0
}

// ICO with PNG entries, which every current browser reads
function ico(pngs, sizes) {
  const header = Buffer.alloc(6 + 16 * pngs.length)
  header.writeUInt16LE(1, 2)
  header.writeUInt16LE(pngs.length, 4)
  let offset = header.length
  pngs.forEach((png, i) => {
    const entry = 6 + 16 * i
    header.writeUInt8(sizes[i] % 256, entry)
    header.writeUInt8(sizes[i] % 256, entry + 1)
    header.writeUInt16LE(1, entry + 4)
    header.writeUInt16LE(32, entry + 6)
    header.writeUInt32LE(png.length, entry + 8)
    header.writeUInt32LE(offset, entry + 12)
    offset += png.length
  })
  return Buffer.concat([header, ...pngs])
}
