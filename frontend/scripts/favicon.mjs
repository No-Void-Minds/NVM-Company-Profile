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
// Tokens --fg and --bg of the light theme. On the app icons a light logo sits on the
// dark one and the other way round. iOS fills transparency with black, so those keep a box.
const DARK = '#111317'
const LIGHT = '#F3F2EE'
// Tab icons stay transparent. A thin contour in the opposite tone (--surface or --fg)
// keeps the mark visible on light and dark tab strips alike.
const OUTLINE_LIGHT = '#FFFFFF'
// Contour width as a share of the icon size: 1 px at 32
const OUTLINE = 1 / 32
// Tab icons are drawn this many times larger, then scaled down, so the contour of
// half a pixel at 16 comes out as a soft edge instead of rounding to 0 or 1
const SUPERSAMPLE = 8
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
  const light = luminance(data) > 0.5
  const background = light ? DARK : LIGHT
  const outline = light ? DARK : OUTLINE_LIGHT
  console.log(
    `sumber ${info.width}x${info.height} setelah trim, latar ${background}, garis ${outline}`,
  )
  const trimmed = await logo.png().toBuffer()

  function mark(size) {
    const inner = Math.round(size * FILL)
    return sharp(trimmed)
      .resize(inner, inner, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
        kernel: 'lanczos3',
      })
      .toBuffer()
  }

  async function square(size) {
    return sharp({ create: { width: size, height: size, channels: 4, background } })
      .composite([{ input: await mark(size), gravity: 'center' }])
      .png({ compressionLevel: 9 })
      .toBuffer()
  }

  // Transparent, with a contour that follows the shape of the logo
  async function tab(size) {
    const big = size * SUPERSAMPLE
    const clear = { r: 0, g: 0, b: 0, alpha: 0 }
    const placed = await sharp({
      create: { width: big, height: big, channels: 4, background: clear },
    })
      .composite([{ input: await mark(big), gravity: 'center' }])
      .raw()
      .toBuffer()
    const alpha = Buffer.alloc(big * big)
    for (let i = 0; i < alpha.length; i++) alpha[i] = placed[i * 4 + 3]
    const grown = dilate(alpha, big, size * OUTLINE * SUPERSAMPLE)
    const contour = await sharp({
      create: { width: big, height: big, channels: 3, background: outline },
    })
      .joinChannel(grown, { raw: { width: big, height: big, channels: 1 } })
      .png()
      .toBuffer()
    const drawn = await sharp(contour)
      .composite([{ input: placed, raw: { width: big, height: big, channels: 4 } }])
      .png()
      .toBuffer()
    return sharp(drawn)
      .resize(size, size, { kernel: 'lanczos3' })
      .png({ compressionLevel: 9 })
      .toBuffer()
  }

  writeFileSync(join(out, 'favicon-32.png'), await tab(32))
  const files = {
    'apple-touch-icon.png': 180,
    'icon-192.png': 192,
    'icon-512.png': 512,
  }
  for (const [name, size] of Object.entries(files)) {
    writeFileSync(join(out, name), await square(size))
  }
  writeFileSync(
    join(out, 'favicon.ico'),
    ico(await Promise.all([16, 32, 48].map(tab)), [16, 32, 48]),
  )
  console.log(`favicon.ico, favicon-32.png, ${Object.keys(files).join(', ')} ditulis ke public/`)
}

// Grows the opaque area by radius pixels in every direction (a round brush), so the
// contour keeps the curves of the logo instead of turning into a box
function dilate(alpha, width, radius) {
  const offsets = []
  const r = Math.ceil(radius)
  for (let dy = -r; dy <= r; dy++) {
    for (let dx = -r; dx <= r; dx++) {
      if (dx * dx + dy * dy <= radius * radius) offsets.push([dx, dy])
    }
  }
  const out = Buffer.alloc(alpha.length)
  for (let y = 0; y < width; y++) {
    for (let x = 0; x < width; x++) {
      let max = 0
      for (const [dx, dy] of offsets) {
        const sx = x + dx
        const sy = y + dy
        if (sx < 0 || sy < 0 || sx >= width || sy >= width) continue
        const a = alpha[sy * width + sx]
        if (a > max) max = a
        if (max === 255) break
      }
      out[y * width + x] = max
    }
  }
  return out
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
