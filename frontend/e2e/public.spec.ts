import AxeBuilder from '@axe-core/playwright'
import {
  brightSignalUses,
  EN_ROUTES,
  expect,
  focusRing,
  horizontalOverflow,
  PUBLIC_ROUTES,
  settled,
  smallTargets,
  test,
  THEMES,
  useTheme,
  WIDTHS,
} from './support'

// Query strings such as ?lang=id must still match (FR-113)
const TECHS_API = /\/api\/techs(\?|$)/
const GALLERY_API = /\/api\/gallery(\?|$)/

const MENU = ['Brand', 'Teknologi', 'Produk', 'B2B', 'Galeri', 'Testimoni', 'Size', 'Kontak']

test.describe('AC-01 navigasi', () => {
  test('menu desktop membuka route yang ada', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    for (const label of MENU) {
      await page
        .getByRole('navigation', { name: 'Menu utama' })
        .getByRole('link', { name: label })
        .click()
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Halaman ini tidak ada' })).toHaveCount(0)
    }
  })

  test('menu panel mobile membuka route yang ada', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/')
    for (const label of MENU) {
      await page.getByRole('button', { name: 'Buka menu' }).click()
      await page
        .getByRole('dialog', { name: 'Menu utama' })
        .getByRole('link', { name: label })
        .click()
      await expect(page.getByRole('dialog', { name: 'Menu utama' })).toHaveCount(0)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.getByRole('heading', { name: 'Halaman ini tidak ada' })).toHaveCount(0)
    }
  })

  test('404 punya tombol ke Beranda dan Teknologi', async ({ page }) => {
    await page.goto('/halaman-yang-tidak-ada')
    await expect(page.getByRole('heading', { name: 'Halaman ini tidak ada' })).toBeVisible()
    await page.getByRole('main').getByRole('link', { name: 'Lihat 10 material system' }).click()
    await expect(page).toHaveURL(/\/teknologi$/)
  })

  test('FR-131 footer ke toko Shopee, link marketplace tanpa URL tidak tampil', async ({
    page,
  }) => {
    await page.goto('/')
    const footer = page.getByRole('contentinfo')
    await expect(footer.getByText('Bandung')).toBeVisible()
    const shopee = footer.getByRole('link', { name: 'Shopee (buka di tab baru)' })
    await expect(shopee).toHaveAttribute('href', 'https://shopee.co.id/novoidminds')
    await expect(shopee).toHaveAttribute('rel', 'noopener noreferrer')
    await expect(footer.getByRole('link', { name: 'Kebijakan privasi' })).toBeVisible()
    await expect(footer.getByRole('link', { name: /TikTok/ })).toHaveCount(0)
  })
})

test.describe('AC-02, AC-03 Teknologi', () => {
  test('AC-02 10 tech dan filter Mudah gerah', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/teknologi')
    await settled(page)
    const rows = page.locator('.index-row')
    await expect(rows).toHaveCount(10)
    await expect(page.getByText('10 cocok')).toBeVisible()

    await page.getByRole('button', { name: 'Mudah gerah' }).click()
    await expect(page.getByRole('button', { name: 'Mudah gerah' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.getByText('03 cocok')).toBeVisible()
    const bright = page.locator('.index-row:not(.index-row-dim)')
    await expect(bright).toHaveText([/AEZY™/, /AEZY COTTON™/, /AEZY 2™/])
    await expect(page.locator('.index-row-dim')).toHaveCount(7)
  })

  for (const width of [375, 1440]) {
    test(`AC-03 deep link formlock di lebar ${width}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 })
      await page.goto('/teknologi#lab-formlock')
      await settled(page)
      await expect(
        page.getByRole('heading', { level: 2, name: 'FORMLOCK™', exact: true }),
      ).toBeVisible()
      await expect(page.getByText('Untuk potongan yang menolak melorot.')).toBeVisible()
      await expect(
        page.getByRole('heading', { level: 2, name: 'FORMLOCK™', exact: true }),
      ).toBeInViewport({ ratio: 1 })
      if (width >= 1024) {
        // The panel top must clear the fixed header, and the panel must fit the screen.
        const panel = await page.locator('.tech-panel').boundingBox()
        expect(panel?.y ?? 0).toBeGreaterThanOrEqual(64)
        expect((panel?.y ?? 0) + (panel?.height ?? 0)).toBeLessThanOrEqual(900)
      }
    })
  }

  test('FR-24 status tech tetap tampil', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/teknologi#lab-aezy')
    await settled(page)
    await expect(
      page.getByLabel('Status').or(page.getByText('Belum tersedia')).first(),
    ).toBeVisible()
  })

  test('FR-20 accordion mobile hanya satu terbuka', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/teknologi')
    await settled(page)
    await page.locator('.index-row').nth(0).click()
    await page.locator('.index-row').nth(3).click()
    await expect(page.locator('.index-row[aria-expanded="true"]')).toHaveCount(1)
    await expect(page.locator('article')).toHaveCount(1)
  })
})

test.describe('AC-04, AC-05 Size', () => {
  test('tabel utuh tanpa geser di 1024, kontrol native ikut tema terang, tombol header satu baris', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1024, height: 800 })
    await page.goto('/size?tech=aezy&fit=Regular')
    await settled(page)
    const clipped = await page
      .locator('.scroll-x')
      .evaluate((el) => el.scrollWidth - el.clientWidth)
    expect(clipped).toBeLessThanOrEqual(0)
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'light')
    // FR-130: the header has no shop button any more
    await expect(page.getByRole('banner').getByRole('link', { name: /Belanja|Shop/ })).toHaveCount(
      0,
    )
  })

  test('AC-04 tinggi 172 menandai L, kaos 51 x 69 menandai M', async ({ page }) => {
    await page.goto('/size?tech=aezy&fit=Regular')
    await settled(page)
    await page.getByLabel('Tinggi badan (cm)').fill('172')
    await expect(page.locator('tr[aria-current="true"]')).toHaveCount(1)
    await expect(page.locator('tr[aria-current="true"] td').first()).toContainText('L')
    await expect(page.getByText('Tinggi badan hanya rekomendasi.')).toBeVisible()
    await expect(page.getByText('Toleransi 1 sampai 2 cm.')).toBeVisible()

    await page.getByRole('tab', { name: 'Dari kaos favorit' }).click()
    await page.getByLabel('Lebar badan kaos (cm)').fill('51')
    await page.getByLabel('Panjang badan kaos (cm)').fill('69')
    await expect(page.locator('tr[aria-current="true"]')).toHaveCount(1)
    await expect(page.locator('tr[aria-current="true"] td').first()).toContainText('M')
    await expect(page.getByRole('columnheader', { name: 'Selisih (cm)' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Lihat ukuran ini di Shopee' })).toHaveAttribute(
      'href',
      'https://shopee.co.id/No-Void-Minds-AEZY-Regular-T-Shirt-Core-i.462123491.25438116155',
    )
  })

  test('FR-73 batas dua ukuran menampilkan keduanya', async ({ page }) => {
    await page.goto('/size?tech=aezy&fit=Regular')
    await settled(page)
    await page.getByLabel('Tinggi badan (cm)').fill('170')
    await expect(page.locator('tr[aria-current="true"]')).toHaveCount(2)
    await expect(page.getByText('Hasilmu ada di antara')).toBeVisible()
  })

  test('AC-05 tanpa size chart tidak menebak', async ({ page }) => {
    await page.goto('/size?tech=formlock&fit=Boxy')
    await settled(page)
    await expect(page.getByText('Size chart untuk kombinasi ini belum tersedia')).toBeVisible()
    const ask = page.getByRole('link', { name: 'Tanya ukuran lewat WhatsApp' })
    await expect(ask).toHaveAttribute('href', /wa\.me\/6282111228700/)
    await expect(page.getByText('Rekomendasi:')).toHaveCount(0)
    await expect(page.locator('table')).toHaveCount(0)
  })

  test('FR-70 fit mengikuti tech, tech tanpa fit menyembunyikan fit', async ({ page }) => {
    await page.goto('/size?tech=aezy&fit=Regular')
    await settled(page)
    await expect(page.getByLabel('Fit').locator('option')).toHaveText(['Regular', 'Fitted', 'Polo'])
    await page.getByLabel('Tech').selectOption('antshell')
    await expect(page.getByLabel('Fit')).toHaveCount(0)
    await expect(page.getByText('Size chart untuk kombinasi ini belum tersedia')).toBeVisible()
  })
})

test.describe('Produk', () => {
  test('FR-31 sel matriks dan BR-04 Coming soon', async ({ page }) => {
    await page.goto('/produk')
    await settled(page)
    await expect(page.getByRole('link', { name: 'Lihat AEZY™ Regular di Shopee' })).toHaveAttribute(
      'href',
      'https://shopee.co.id/No-Void-Minds-AEZY-Regular-T-Shirt-Core-i.462123491.25438116155',
    )
    await expect(
      page.getByRole('link', { name: 'Lihat CURFLEX™ Mini Fitted di Shopee' }),
    ).toHaveAttribute(
      'href',
      'https://shopee.co.id/No-Void-Minds-Curflex-Mini-Fitted-Crop-Women-T-Shirt-Core-i.462123491.51761294268',
    )
    const moana = page.getByRole('listitem').filter({ hasText: 'Moana' })
    await expect(moana.getByText('Coming soon')).toBeVisible()
    await expect(moana.getByRole('link')).toHaveCount(0)
  })
})

test.describe('AC-10 state', () => {
  test('Teknologi dan Lab index kosong punya pesan jujur', async ({ page }) => {
    await page.route(TECHS_API, (route) => route.fulfill({ json: [] }))
    await page.route('**/api/lab-stats', (route) =>
      route.fulfill({ json: { systems: 0, on_rack: 0, est_year: 2021 } }),
    )
    await page.goto('/teknologi')
    await settled(page)
    await expect(page.getByText('Daftar material system belum tersedia')).toBeVisible()
    await page.goto('/')
    await settled(page)
    await expect(page.getByText('Lab index belum tersedia')).toBeVisible()
  })

  test('Galeri dan Testimoni kosong jujur', async ({ page }) => {
    await page.route(GALLERY_API, (route) => route.fulfill({ json: [] }))
    await page.route('**/api/testimonials', (route) => route.fulfill({ json: [] }))
    await page.goto('/galeri')
    await settled(page)
    await expect(page.getByText('Galeri sedang disiapkan')).toBeVisible()
    await page.goto('/testimoni')
    await settled(page)
    await expect(
      page.getByText('Testimoni sedang kami kumpulkan dari Shopee dan TikTok Shop.'),
    ).toBeVisible()
  })

  test('FR-13 potongan kosong hilang dari Beranda', async ({ page }) => {
    await page.route(GALLERY_API, (route) => route.fulfill({ json: [] }))
    await page.route('**/api/testimonials', (route) => route.fulfill({ json: [] }))
    await page.goto('/')
    await settled(page)
    await expect(page.getByRole('heading', { name: 'Kata pembeli' })).toHaveCount(0)
    await expect(page.getByRole('heading', { name: 'Galeri', level: 2 })).toHaveCount(0)
  })

  for (const [route, pattern, message] of [
    ['/', '**/api/lab-stats', 'Tidak bisa terhubung'],
    ['/teknologi', TECHS_API, 'Tidak bisa terhubung'],
    ['/produk', TECHS_API, 'Tidak bisa terhubung'],
    ['/galeri', GALLERY_API, 'Tidak bisa terhubung'],
    ['/testimoni', '**/api/testimonials', 'Tidak bisa terhubung'],
    ['/size', TECHS_API, 'Tidak bisa terhubung'],
    // FR-116: the English site gets the English text for the same error code
    ['/en/teknologi', TECHS_API, 'Cannot reach the server'],
  ] as const) {
    test(`API mati di ${route} menampilkan error dan Coba lagi`, async ({
      page,
      allowFailedRequests,
    }) => {
      allowFailedRequests.value = true
      await page.route(pattern, (r) => r.abort())
      await page.goto(route)
      await expect(page.getByRole('alert')).toContainText(message)
      await page.unroute(pattern)
      await page
        .getByRole('button', { name: route.startsWith('/en') ? 'Try again' : 'Coba lagi' })
        .click()
      await expect(page.getByRole('alert')).toHaveCount(0)
      await settled(page)
    })
  }

  test('skeleton garis rajut saat memuat', async ({ page }) => {
    await page.route(TECHS_API, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 800))
      await route.continue()
    })
    await page.goto('/teknologi')
    await expect(page.locator('[role="status"].knit-bg')).toBeVisible()
    await settled(page)
  })
})

test.describe('AC-11 reduced motion', () => {
  test.use({ reducedMotion: 'reduce' })

  for (const route of PUBLIC_ROUTES) {
    test(`tidak ada yang bergerak di ${route}`, async ({ page }) => {
      await page.goto(route)
      await settled(page)
      await page.waitForTimeout(600)
      const running = await page.evaluate(
        () => document.getAnimations().filter((a) => a.playState === 'running').length,
      )
      expect(running).toBe(0)
    })
  }

  test('ticker diam tanpa tombol, kanvas tidak bereaksi', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await settled(page)
    await expect(page.locator('.ticker-track')).toHaveCSS('animation-name', 'none')
    await expect(page.getByRole('button', { name: /teks berjalan/ })).toHaveCount(0)

    const canvas = page.locator('section canvas').first()
    const before = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())
    expect(before.length).toBeGreaterThan(1000)
    await page.mouse.move(600, 300)
    await page.mouse.move(700, 350, { steps: 5 })
    await page.waitForTimeout(200)
    expect(await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(before)
  })

  test('Fabric Probe jadi diagram diam berlabel', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/teknologi')
    await settled(page)
    // Both the swatch and the probe carry the label
    await expect(page.getByText('Ilustrasi, bukan hasil uji')).toHaveCount(2)
    await expect(page.getByText('Ilustrasi, bukan hasil uji').first()).toBeVisible()
    await expect(page.getByRole('button', { name: 'Peragakan sifat kain' })).toHaveCount(0)
  })
})

test.describe('NFR-04 tanpa reduced motion', () => {
  test('Knit Field bereaksi lalu berhenti sendiri', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await settled(page)
    const canvas = page.locator('section canvas').first()
    const before = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())
    await page.mouse.move(500, 300)
    await page.mouse.move(640, 360, { steps: 8 })
    await page.waitForTimeout(120)
    expect(await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).not.toBe(before)

    // Pointer leaves the hero: the spring settles and the frame loop must stop.
    await page.mouse.move(640, 880)
    await page.waitForTimeout(3000)
    const settledFrame = await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())
    await page.waitForTimeout(300)
    expect(await canvas.evaluate((c: HTMLCanvasElement) => c.toDataURL())).toBe(settledFrame)
  })

  test('hanya ticker yang berjalan saat diam, dan bisa dijeda', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await settled(page)
    await page.mouse.move(0, 890)
    await page.waitForTimeout(800)
    const running = () =>
      page.evaluate(() => document.getAnimations().filter((a) => a.playState === 'running').length)
    expect(await running()).toBe(1)
    await page.getByRole('button', { name: 'Jeda teks berjalan' }).click()
    await page.mouse.move(0, 890)
    await expect(page.getByRole('button', { name: 'Jalankan teks berjalan' })).toBeVisible()
    await page.locator('body').click({ position: { x: 1, y: 880 } })
    await page.waitForTimeout(200)
    expect(await running()).toBe(0)
  })
})

// AC-13 and AC-18: every public page in both languages, both themes, 5 widths.
// Axe wcag2aa includes color-contrast, which is the contrast check of AC-18.
test.describe('AC-13, AC-18 target sentuh, axe, kontras', () => {
  test.describe.configure({ timeout: 240_000 })
  for (const theme of THEMES) {
    for (const width of WIDTHS) {
      test(`${theme} lebar ${width}: tanpa scroll horizontal, target 44 px, axe bersih`, async ({
        page,
      }) => {
        await useTheme(page, theme)
        await page.setViewportSize({ width, height: 900 })
        const problems: string[] = []
        // English pages at the narrowest and widest width, the rest share the layout
        const routes =
          width === 320 || width === 1440 ? [...PUBLIC_ROUTES, ...EN_ROUTES] : PUBLIC_ROUTES
        for (const route of routes) {
          await page.goto(route)
          await settled(page)
          expect(await page.evaluate(() => document.documentElement.dataset.theme ?? 'light')).toBe(
            theme,
          )
          const overflow = await horizontalOverflow(page)
          if (overflow > 0) problems.push(`${route}: overflow ${overflow}px`)
          for (const small of await smallTargets(page)) problems.push(`${route}: kecil ${small}`)
          if (theme === 'light') {
            for (const use of await brightSignalUses(page))
              problems.push(`${route}: #FF5A36 ${use}`)
          }
          const axe = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze()
          for (const violation of axe.violations) {
            const target = violation.nodes[0]?.target.join(' ')
            problems.push(`${route}: axe ${violation.id} (${violation.nodes.length}) ${target}`)
          }
        }
        expect(problems).toEqual([])
      })
    }
  }
})

test.describe('AC-12 keyboard publik', () => {
  test('Tab pertama ke skip link, fokus selalu terlihat di Beranda', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await settled(page)
    await page.keyboard.press('Tab')
    expect((await focusRing(page)).text).toBe('Lewati ke konten')
    await expect(page.locator('.skip-link')).toBeInViewport()
    for (let i = 0; i < 18; i++) {
      const ring = await focusRing(page)
      expect(ring.ok, `fokus ke-${i}: ${ring.tag} ${ring.text}`).toBe(true)
      await page.keyboard.press('Tab')
    }
  })

  test('skip link memindahkan fokus ke main', async ({ page }) => {
    await page.goto('/')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#main$/)
    expect(await page.evaluate(() => document.activeElement?.id)).toBe('main')
  })

  test('menu mobile: fokus terkunci, Escape menutup, fokus kembali', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/')
    const open = page.getByRole('button', { name: 'Buka menu' })
    await open.focus()
    await page.keyboard.press('Enter')
    const panel = page.getByRole('dialog', { name: 'Menu utama' })
    await expect(panel).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tutup menu' })).toBeFocused()
    for (let i = 0; i < 14; i++) {
      await page.keyboard.press('Tab')
      expect(await panel.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    }
    await page.keyboard.press('Shift+Tab')
    expect(await panel.evaluate((el) => el.contains(document.activeElement))).toBe(true)
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await expect(open).toBeFocused()
  })

  test('Teknologi dan Size dengan keyboard', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/teknologi')
    await settled(page)
    await page.locator('.index-row').nth(5).focus()
    await expect(page.getByRole('heading', { level: 2, name: 'CURFLEX™' })).toBeVisible()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/#lab-curflex$/)

    await page.goto('/size?tech=aezy&fit=Regular')
    await settled(page)
    await page.getByRole('tab', { name: 'Dari tinggi badan' }).focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.getByRole('tab', { name: 'Dari kaos favorit' })).toBeFocused()
    await expect(page.getByRole('tab', { name: 'Dari kaos favorit' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(page.getByLabel('Lebar badan kaos (cm)')).toBeVisible()
  })
})
