import { randomUUID } from 'node:crypto'
import AxeBuilder from '@axe-core/playwright'
import {
  ADMIN_ROUTES,
  adminPage,
  expect,
  focusRing,
  horizontalOverflow,
  settled,
  smallTargets,
  test,
  UJI_IMAGE,
  WIDTHS,
} from './support'

const RUN = Date.now().toString(36)

test.describe.configure({ mode: 'serial' })

test('AC-06 inquiry valid, klik ganda, muncul di admin', async ({ page, browser }) => {
  const name = `UJI E2E ${RUN}`
  let posts = 0
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.url().endsWith('/api/inquiries')) posts++
  })

  await page.goto('/b2b')
  await settled(page)
  await page.getByLabel('Nama', { exact: true }).fill(name)
  await page.getByLabel('Nama usaha atau komunitas').fill('Toko UJI')
  await page.getByLabel('Kota').fill('Bandung')
  await page.getByLabel('WhatsApp').fill('0812-3456-7890')
  await page.getByLabel('AEZY™', { exact: true }).check()
  await page.getByLabel('Pesan').fill('UJI pesan inquiry dari Playwright.')
  await page.getByRole('checkbox', { name: /Saya setuju/ }).check()
  await page.getByRole('button', { name: 'Kirim inquiry wholesale' }).dblclick()

  await expect(page.getByRole('heading', { name: 'Inquiry terkirim' })).toBeFocused()
  const code = (await page.locator('p.font-mono').textContent())?.trim() ?? ''
  expect(code).toMatch(/^B2B-[0-9A-HJKMNP-TV-Z]{6}$/)
  await expect(page.getByRole('link', { name: 'Lanjut chat WhatsApp' })).toHaveAttribute(
    'href',
    new RegExp(`wa\\.me/6282111228700.*${code}`),
  )
  expect(posts).toBe(1)

  const admin = await adminPage(browser)
  await admin.page.goto('/admin/inquiry')
  await settled(admin.page)
  await expect(admin.page.getByRole('button', { name: code })).toHaveCount(1)
  const rows = await admin.page.request.get('/api/admin/inquiries').then((r) => r.json())
  expect(rows.filter((row: { name: string }) => row.name === name)).toHaveLength(1)

  await admin.page.getByRole('button', { name: code }).click()
  await expect(admin.page.getByRole('heading', { name: code })).toBeVisible()
  await admin.page.getByLabel('Status', { exact: true }).last().selectOption('done')
  await expect(admin.page.locator('tr', { hasText: code })).toContainText('Selesai')
  await admin.context.close()
})

test('FR-42 validasi per field tersambung aria-describedby, fokus ke error pertama', async ({
  page,
}) => {
  await page.goto('/b2b')
  await settled(page)
  await page.getByRole('button', { name: 'Kirim inquiry wholesale' }).click()
  const name = page.getByLabel('Nama', { exact: true })
  await expect(name).toBeFocused()
  await expect(name).toHaveAttribute('aria-invalid', 'true')
  await expect(name).toHaveAttribute('aria-describedby', 'name-error')
  await expect(page.locator('#name-error')).toContainText('2 sampai 80')
  await expect(page.locator('#phone-error')).toContainText('salah satu cukup')
  await expect(page.locator('#consent-error')).toBeVisible()
})

test('AC-12 formulir B2B penuh dengan keyboard', async ({ page }) => {
  await page.goto('/b2b')
  await settled(page)
  await page.getByRole('radio', { name: 'Collaboration' }).focus()
  await expect(page.getByRole('radio', { name: 'Collaboration' })).toBeFocused()
  await page.keyboard.press('Space')
  await page.keyboard.press('Tab')
  await expect(page.getByLabel('Nama', { exact: true })).toBeFocused()
  await page.keyboard.type(`UJI Keyboard ${RUN}`)
  await page.keyboard.press('Tab')
  await page.keyboard.type('Komunitas UJI')
  await page.keyboard.press('Tab')
  await page.keyboard.type('Bandung')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.type('+6281234567890')
  await page.getByLabel('Pesan').focus()
  await page.keyboard.type('UJI pesan dari keyboard saja.')
  await page.getByRole('checkbox', { name: /Saya setuju/ }).focus()
  await page.keyboard.press('Space')
  await page.getByRole('button', { name: 'Kirim inquiry collaboration' }).focus()
  expect((await focusRing(page)).ok).toBe(true)
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Inquiry terkirim' })).toBeVisible()
})

test('AC-07 kiriman di atas kuota ditolak dengan pesan manusia', async ({ page }) => {
  await page.goto('/b2b')
  await settled(page)
  // Use up what is left of the 5 per hour quota directly against the API.
  for (let i = 0; i < 6; i++) {
    const response = await page.request.post('/api/inquiries', {
      headers: { 'Idempotency-Key': randomUUID() },
      data: {
        kind: 'wholesale',
        name: `UJI Kuota ${RUN} ${i}`,
        org: 'Toko UJI',
        city: 'Bandung',
        email: 'uji@example.com',
        message: 'UJI mengisi kuota rate limit.',
        consent: true,
      },
    })
    if (response.status() === 429) {
      expect((await response.json()).error.code).toBe('RATE_LIMITED')
      break
    }
    expect(response.status(), `kiriman ${i}`).toBe(201)
    if (i === 5) throw new Error('rate limit tidak pernah menolak')
  }

  await page.getByLabel('Nama', { exact: true }).fill(`UJI Ditolak ${RUN}`)
  await page.getByLabel('Nama usaha atau komunitas').fill('Toko UJI')
  await page.getByLabel('Kota').fill('Bandung')
  await page.getByLabel('Email').fill('uji@example.com')
  await page.getByLabel('Pesan').fill('UJI pesan yang harus ditolak.')
  await page.getByRole('checkbox', { name: /Saya setuju/ }).check()
  await page.getByRole('button', { name: 'Kirim inquiry wholesale' }).click()
  await expect(page.getByRole('alert')).toContainText('Terlalu banyak kiriman')
  await expect(page.getByRole('heading', { name: 'Inquiry terkirim' })).toHaveCount(0)
})

test('AC-09 ekspor CSV dan XLSX lewat tombol admin', async ({ browser }) => {
  const { context, page } = await adminPage(browser)
  await page.goto('/admin/inquiry')
  await settled(page)

  for (const [label, ext] of [
    ['Ekspor CSV', 'csv'],
    ['Ekspor XLSX', 'xlsx'],
  ]) {
    const waiting = page.waitForEvent('download')
    await page.getByRole('link', { name: label }).click()
    const download = await waiting
    expect(download.suggestedFilename()).toMatch(new RegExp(`^inquiries-\\d{8}\\.${ext}$`))
    expect(await download.failure()).toBeNull()
  }
  await context.close()
})

test('FR-91, FR-50, FR-51 unggah galeri lalu lightbox lengkap', async ({ browser }) => {
  const { context, page } = await adminPage(browser)
  const alts = [`UJI foto satu ${RUN}`, `UJI foto dua ${RUN}`]

  await page.goto('/admin/galeri')
  await settled(page)
  await page.getByRole('button', { name: 'Unggah foto' }).click()
  await expect(page.locator('#gallery-alt-error')).toContainText('wajib')

  for (const [index, alt] of alts.entries()) {
    await page.getByLabel('File gambar').setInputFiles(UJI_IMAGE)
    await page.getByLabel('Teks alt').fill(alt)
    await page.getByLabel('Kategori').fill(index === 0 ? 'lookbook' : 'event')
    await page.getByRole('button', { name: 'Unggah foto' }).click()
    await expect(page.getByText(alt, { exact: true })).toBeVisible()
  }

  await page.goto('/galeri')
  await settled(page)
  await expect(page.getByRole('button', { name: 'event' })).toBeVisible()
  await page.getByRole('button', { name: 'event' }).click()
  await expect(page.getByRole('button', { name: `Perbesar foto: ${alts[0]}` })).toHaveCount(0)
  await page.getByRole('button', { name: 'Semua' }).click()

  const opener = page.getByRole('button', { name: `Perbesar foto: ${alts[0]}` })
  await opener.focus()
  await page.keyboard.press('Enter')
  const lightbox = page.getByRole('dialog')
  await expect(lightbox).toBeVisible()
  const counter = lightbox.locator('[aria-live="polite"]')
  const first = await counter.textContent()
  await page.keyboard.press('ArrowRight')
  await expect(counter).not.toHaveText(first ?? '')
  await page.keyboard.press('ArrowLeft')
  await expect(counter).toHaveText(first ?? '')
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Tab')
    expect(await lightbox.evaluate((el) => el.contains(document.activeElement))).toBe(true)
  }

  // Swipe with a real pointer sequence.
  const box = await lightbox.boundingBox()
  if (!box) throw new Error('lightbox tanpa ukuran')
  await page.mouse.move(box.width * 0.8, box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.width * 0.2, box.height / 2, { steps: 4 })
  await page.mouse.up()
  await expect(counter).not.toHaveText(first ?? '')

  await page.keyboard.press('Escape')
  await expect(lightbox).toHaveCount(0)
  await expect(opener).toBeFocused()

  // Beranda shows the section only now that data exists (FR-13).
  await page.goto('/')
  await settled(page)
  await expect(page.getByRole('heading', { name: 'Galeri', level: 2 })).toBeVisible()

  await page.goto('/admin/galeri')
  await settled(page)
  for (const alt of alts) {
    const row = page.getByRole('listitem').filter({ hasText: alt })
    const remove = row.getByRole('button', { name: 'Hapus' })
    await remove.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(remove).toBeFocused()
    await page.keyboard.press('Enter')
    await page.getByRole('button', { name: 'Hapus foto' }).click()
    await expect(page.getByText(alt, { exact: true })).toHaveCount(0)
  }
  await context.close()
})

test('AC-08 testimoni tidak bisa publish tanpa centang buram', async ({ browser }) => {
  const { context, page } = await adminPage(browser)
  const transcript = `UJI transkrip ${RUN}`

  await page.goto('/admin/testimoni')
  await settled(page)
  const publish = page.getByRole('checkbox', { name: 'Publikasikan di halaman Testimoni' })
  await expect(publish).toBeDisabled()

  await page.getByLabel('File tangkapan layar').setInputFiles(UJI_IMAGE)
  await page.getByLabel('Tanggal ulasan').fill('2026-10-01')
  await page.getByLabel('Tech').selectOption('aezy')
  await page.getByLabel('Rating bintang').selectOption('5')
  await page.getByLabel('Transkrip').fill(transcript)
  await page.getByRole('button', { name: 'Unggah testimoni' }).click()

  const row = page.getByRole('listitem').filter({ hasText: transcript })
  await expect(row).toContainText('draf')
  await expect(row.getByRole('button', { name: 'Publikasikan' })).toBeDisabled()

  // Even a hand-made request is refused (BR-02).
  const csrf = (await page.request.get('/api/admin/me').then((r) => r.json())).csrf_token
  const id = (await page.request.get('/api/admin/testimonials').then((r) => r.json())).find(
    (t: { transcript: string }) => t.transcript === transcript,
  ).id
  const forced = await page.request.patch(`/api/admin/testimonials/${id}`, {
    headers: { 'X-CSRF-Token': csrf },
    data: { published: true },
  })
  expect(forced.status()).toBe(409)

  await row.getByRole('button', { name: 'Ubah' }).click()
  await page.getByRole('checkbox', { name: 'Nama dan foto pembeli sudah diburamkan' }).check()
  await publish.check()
  await page.getByRole('button', { name: 'Simpan perubahan testimoni' }).click()
  await expect(row).toContainText('dipublikasikan')

  await page.goto('/testimoni')
  await settled(page)
  await expect(page.getByText('dari 1 tangkapan layar yang kami tampilkan')).toBeVisible()
  await expect(page.getByAltText('Tangkapan layar ulasan dari Shopee')).toBeVisible()
  await page.getByText('Baca transkrip').click()
  await expect(page.getByText(transcript)).toBeVisible()
  await page.getByLabel('Sumber').selectOption('tiktok_shop')
  await expect(page.getByText('Tidak ada testimoni untuk pilihan ini')).toBeVisible()

  await page.goto('/admin/testimoni')
  await settled(page)
  const again = page.getByRole('listitem').filter({ hasText: transcript })
  await again.getByRole('button', { name: 'Hapus' }).click()
  await page.getByRole('button', { name: 'Hapus testimoni' }).click()
  await expect(again).toHaveCount(0)
  await context.close()
})

test('FR-93 size chart dengan pratinjau', async ({ browser }) => {
  const { context, page } = await adminPage(browser)
  await page.goto('/admin/size-chart')
  await settled(page)
  await page.getByLabel('Key').fill('uji-chart-e2e')
  await page.getByLabel('Judul').fill('UJI chart')
  await page.getByLabel('Baris tabel').fill('Size | Height\nS | < 160\nM | 160-170')
  await expect(page.getByRole('region', { name: 'Pratinjau tabel size chart' })).toContainText(
    '160-170',
  )
  await page.getByRole('button', { name: 'Simpan size chart' }).click()
  const row = page.getByRole('listitem').filter({ hasText: 'uji-chart-e2e' })
  await expect(row).toBeVisible()
  await row.getByRole('button', { name: 'Hapus' }).click()
  await page.getByRole('button', { name: 'Hapus size chart' }).click()
  await expect(row).toHaveCount(0)
  await context.close()
})

test('FR-94 toggle tech dan collab lalu kembali ke seed', async ({ browser }) => {
  const { context, page } = await adminPage(browser)
  await page.goto('/admin/katalog')
  await settled(page)
  const tech = page.getByRole('button', { name: 'THERCO' })
  await expect(tech).toContainText('Belum tersedia')
  await tech.click()
  await expect(tech).toContainText('On the rack')
  await tech.click()
  await expect(tech).toContainText('Belum tersedia')

  const collab = page.getByRole('button', { name: 'Moana' })
  await expect(collab).toContainText('Coming soon')
  await collab.click()
  await expect(collab).toContainText('Tersedia')
  await collab.click()
  await expect(collab).toContainText('Coming soon')
  await context.close()
})

const statusLabel = (onRack: boolean) => (onRack ? 'On the rack' : 'Belum tersedia')

test('FR-94 status on the rack tetap setelah reload', async ({ browser }) => {
  const { context, page } = await adminPage(browser)
  const tech = page.getByRole('button', { name: 'THERCO' })
  // The starting value is read, not assumed, so the test also runs after an admin changed it.
  const initial = (await (await page.request.get('/api/admin/techs')).json()).find(
    (t: { key: string }) => t.key === 'therco',
  ).on_rack as boolean
  try {
    await page.goto('/admin/katalog')
    await settled(page)
    await expect(tech).toContainText(statusLabel(initial))
    const saved = page.waitForResponse(
      (r) => r.url().endsWith('/api/admin/techs/therco') && r.request().method() === 'PATCH',
    )
    await tech.click()
    expect((await saved).status()).toBe(200)
    await expect(tech).toContainText(statusLabel(!initial))

    await page.reload()
    await settled(page)
    await expect(tech).toContainText(statusLabel(!initial))

    await tech.click()
    await expect(tech).toContainText(statusLabel(initial))
    await page.reload()
    await settled(page)
    await expect(tech).toContainText(statusLabel(initial))
  } finally {
    // Restores the starting value even when an assertion above failed midway.
    const me = await (await page.request.get('/api/admin/me')).json()
    await page.request.patch('/api/admin/techs/therco', {
      headers: { 'X-CSRF-Token': me.csrf_token },
      data: { on_rack: initial },
    })
    await context.close()
  }
})

test('FR-94 PATCH gagal tidak mengubah tombol dan menampilkan pesan', async ({ browser }) => {
  const { context, page } = await adminPage(browser)
  await page.route('**/api/admin/techs/therco', (route) =>
    route.request().method() === 'PATCH'
      ? route.fulfill({
          status: 500,
          json: { error: { code: 'INTERNAL', message: 'Terjadi kesalahan di server.' } },
        })
      : route.continue(),
  )
  await page.goto('/admin/katalog')
  await settled(page)
  const tech = page.getByRole('button', { name: 'THERCO' })
  const before = (await tech.textContent())?.includes('On the rack')
    ? 'On the rack'
    : 'Belum tersedia'
  await tech.click()
  await expect(page.locator('[aria-live="assertive"]')).toContainText('Status tidak tersimpan')
  await expect(tech).toContainText(before)
  await expect(tech).toHaveAttribute('aria-busy', 'false')
  await context.close()
})

test('FR-96 log audit menampilkan perubahan', async ({ browser }) => {
  const { context, page } = await adminPage(browser)
  await page.goto('/admin/audit')
  await settled(page)
  await expect(page.getByRole('cell', { name: 'uji-admin' }).first()).toBeVisible()
  await context.close()
})

for (const width of WIDTHS) {
  test(`admin lebar ${width}: tanpa scroll horizontal, target 44 px, axe bersih`, async ({
    browser,
  }) => {
    const { context, page } = await adminPage(browser, width)
    const problems: string[] = []
    for (const route of ADMIN_ROUTES) {
      await page.goto(route)
      await settled(page)
      const overflow = await horizontalOverflow(page)
      if (overflow > 0) problems.push(`${route}: overflow ${overflow}px`)
      for (const small of await smallTargets(page)) problems.push(`${route}: kecil ${small}`)
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
        .analyze()
      for (const violation of axe.violations) {
        const target = violation.nodes[0]?.target.join(' ')
        problems.push(`${route}: axe ${violation.id} (${violation.nodes.length}) ${target}`)
      }
    }
    expect(problems).toEqual([])
    await context.close()
  })
}

test('admin tanpa sesi diarahkan ke login dan kembali ke tujuan', async ({ page }) => {
  await page.goto('/admin/katalog')
  await expect(page).toHaveURL(/\/admin\/login\?next=/)
  await page.getByLabel('Username').fill('uji-admin')
  await page.getByLabel('Password').fill('password-salah-sekali')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('alert')).toContainText('Username atau password salah')
})

test('AC-12 login dan keluar admin dengan keyboard', async ({ browser }) => {
  const context = await browser.newContext({
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5175',
  })
  const page = await context.newPage()
  await page.goto('/admin/login')
  await page.getByLabel('Username').focus()
  await page.keyboard.type('uji-admin')
  await page.keyboard.press('Tab')
  await page.keyboard.type(process.env.UJI_ADMIN_PASSWORD ?? '')
  await page.keyboard.press('Enter')
  await expect(page.getByRole('heading', { name: 'Inquiry B2B' })).toBeVisible()
  await page.getByRole('button', { name: 'Keluar' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/admin\/login$/)
  await context.close()
})
