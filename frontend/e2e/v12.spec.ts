import { EN_ROUTES, expect, PUBLIC_ROUTES, settled, test, useTheme } from './support'

const PROD = Boolean(process.env.E2E_BASE_URL)

const canvasImage = (el: Element, selector: string) =>
  (el.querySelector(selector) as HTMLCanvasElement | null)?.toDataURL() ?? ''

test.describe('AC-17 tema', () => {
  test('pengunjung baru melihat tema terang', async ({ page }) => {
    await page.goto('/')
    await settled(page)
    const html = page.locator('html')
    await expect(html).not.toHaveAttribute('data-theme', 'dark')
    await expect(html).toHaveCSS('color-scheme', 'light')
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(243, 242, 238)')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#f3f2ee')
    await expect(page.getByRole('button', { name: 'Tema gelap' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  test('pilih gelap, reload, tetap gelap tanpa kedip', async ({ page }) => {
    // Records the theme when <body> is created, after the head script and before any paint.
    await page.addInitScript(() => {
      new MutationObserver((records, observer) => {
        if (document.body) {
          ;(window as unknown as { themeAtBody: string }).themeAtBody =
            document.documentElement.dataset.theme ?? 'light'
          observer.disconnect()
        }
      }).observe(document, { childList: true, subtree: true })
    })
    await page.goto('/teknologi')
    await settled(page)
    const toggle = page.getByRole('button', { name: 'Tema gelap' })
    await toggle.click()
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    await expect(page.locator('html')).toHaveCSS('color-scheme', 'dark')
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#08090b')

    await page.reload()
    expect(
      await page.evaluate(() => (window as unknown as { themeAtBody: string }).themeAtBody),
    ).toBe('dark')
    await settled(page)
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(8, 9, 11)')
    await expect(page.getByRole('button', { name: 'Tema gelap' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#08090b')

    await page.getByRole('button', { name: 'Tema gelap' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('storage diblokir: tema terang tetap jalan, tombol tetap bekerja', async ({ page }) => {
    // The Vite dev client reads localStorage itself, so only the built site is judged here
    test.skip(!PROD, 'klien dev Vite ikut membaca localStorage')
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new DOMException('blocked', 'SecurityError')
        },
      })
    })
    await page.goto('/')
    await settled(page)
    await expect(page.locator('html')).toHaveCSS('background-color', 'rgb(243, 242, 238)')
    await page.getByRole('button', { name: 'Tema gelap' }).click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })

  test('FR-103 kanvas hero menggambar ulang saat tema berganti', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await settled(page)
    const hero = page.locator('section.hero')
    const before = await hero.evaluate(canvasImage, 'canvas')
    await page.getByRole('button', { name: 'Tema gelap' }).click()
    await page.waitForTimeout(100)
    expect(await hero.evaluate(canvasImage, 'canvas')).not.toBe(before)
  })

  test('FR-104 logo memakai warna teks tema', async ({ page }) => {
    await page.goto('/')
    const logo = page.locator('.brand-logo')
    await expect(logo).toHaveCSS('background-color', 'rgb(17, 19, 23)')
    await page.getByRole('button', { name: 'Tema gelap' }).click()
    await expect(logo).toHaveCSS('background-color', 'rgb(232, 235, 239)')
  })

  test('FR-102 skrip tema lolos CSP di build produksi', async ({ page }) => {
    test.skip(!PROD, 'CSP hanya dipasang oleh Nginx dan serve-dist')
    const response = await page.goto('/')
    expect(response?.headers()['content-security-policy']).toContain("'sha256-")
    await useTheme(page, 'dark')
    await page.goto('/brand')
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})

test.describe('AC-19 dua bahasa', () => {
  for (const route of EN_ROUTES) {
    test(`${route} berbahasa Inggris`, async ({ page }) => {
      await page.goto(route)
      await settled(page)
      await expect(page.locator('html')).toHaveAttribute('lang', 'en')
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      await expect(page.locator('.skip-link')).toHaveText('Skip to content')
      await expect(page.getByRole('contentinfo')).toContainText('Privacy policy')
      // No Indonesian UI text from the dictionary leaks into the English page
      const body = await page.locator('body').innerText()
      for (const word of [
        'Lewati ke konten',
        'Belanja di Shopify',
        'Kebijakan privasi',
        'Memuat',
      ]) {
        expect(body, word).not.toContain(word)
      }
    })
  }

  test('menu Inggris tetap di /en', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en')
    const links = page.getByRole('navigation', { name: 'Main menu' }).getByRole('link')
    await expect(links).toHaveCount(8)
    for (const href of await links.evaluateAll((all) => all.map((a) => a.getAttribute('href')))) {
      expect(href).toMatch(/^\/en\//)
    }
    await links.filter({ hasText: 'Technology' }).click()
    await expect(page).toHaveURL(/\/en\/teknologi$/)
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('FR-111 tombol ID / EN menjaga halaman dan hash', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/teknologi#lab-formlock')
    await settled(page)
    await expect(page.getByText('Untuk potongan yang menolak melorot.')).toBeVisible()
    await page.getByRole('link', { name: /Read this page in English/ }).click()
    await expect(page).toHaveURL(/\/en\/teknologi#lab-formlock$/)
    await settled(page)
    await expect(
      page.getByRole('heading', { level: 2, name: 'FORMLOCK™', exact: true }),
    ).toBeVisible()
    await expect(page.getByText('For cuts that refuse to sag.')).toBeVisible()
    await page.getByRole('link', { name: /Bahasa Indonesia/ }).click()
    await expect(page).toHaveURL(/\/teknologi#lab-formlock$/)
    await expect(page).not.toHaveURL(/\/en\//)
    await expect(page.getByText('Untuk potongan yang menolak melorot.')).toBeVisible()
  })

  test('FR-111 query ikut terbawa', async ({ page }) => {
    await page.goto('/size?tech=curflex&fit=Fitted')
    await settled(page)
    await page.getByRole('link', { name: /Read this page in English/ }).click()
    await expect(page).toHaveURL(/\/en\/size\?tech=curflex&fit=Fitted$/)
    await settled(page)
    await expect(page.getByLabel('Fit', { exact: true })).toHaveValue('Fitted')
  })

  test.describe('FR-110 browser berbahasa Inggris tidak dialihkan', () => {
    test.use({ locale: 'en-US' })
    test('root tetap Indonesia', async ({ page }) => {
      await page.goto('/')
      await settled(page)
      await expect(page).toHaveURL(/\/$/)
      await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    })
  })

  test('FR-115 transkrip memakai atribut lang', async ({ page }) => {
    await page.route('**/api/testimonials', (route) =>
      route.fulfill({
        json: [
          {
            id: '00000000-0000-4000-8000-000000000001',
            source: 'shopee',
            review_date: '2026-10-01',
            tech_key: null,
            rating: 5,
            transcript: 'Bahannya adem.',
            lang: 'id',
            image: { src: '/brand/nvm-logo.png', srcset: '', width: 4, height: 3 },
          },
        ],
      }),
    )
    await page.goto('/en/testimoni')
    await settled(page)
    await page.getByText('Read the transcript').click()
    await expect(page.getByText('Bahannya adem.')).toHaveAttribute('lang', 'id')
  })
})

test.describe('AC-21 prerender dan sitemap', () => {
  test.skip(!PROD, 'HTML prerender hanya ada di build produksi')

  for (const route of [...PUBLIC_ROUTES.slice(0, -1), ...EN_ROUTES.slice(0, -1)]) {
    test(`${route} punya lang, canonical, hreflang`, async ({ request }) => {
      const html = await (await request.get(route)).text()
      const lang = route.startsWith('/en') ? 'en' : 'id'
      const base = route.startsWith('/en') ? route.slice(3) || '/' : route
      const en = base === '/' ? '/en' : `/en${base}`
      expect(html).toContain(`<html lang="${lang}">`)
      expect(html).toContain(`rel="canonical" href="${lang === 'en' ? en : base}"`)
      expect(html).toContain(`hreflang="id" href="${base}"`)
      expect(html).toContain(`hreflang="en" href="${en}"`)
      expect(html).toContain(`hreflang="x-default" href="${base}"`)
      expect(html).toContain(`og:locale" content="${lang === 'en' ? 'en_US' : 'id_ID'}"`)
      // Real markup, not the empty shell
      expect(html).toContain('<main id="main"')
    })
  }

  test('sitemap memuat kedua bahasa', async ({ request }) => {
    const xml = await (await request.get('/sitemap.xml')).text()
    expect(xml.match(/<url>/g)).toHaveLength(20)
    expect(xml).toContain('/en/teknologi</loc>')
    expect(xml).toContain('hreflang="x-default"')
  })
})

test.describe('AC-22 swatch', () => {
  async function stripImages(page: import('@playwright/test').Page) {
    return page
      .locator('.swatch-strip canvas')
      .evaluateAll((all) => all.map((c) => (c as HTMLCanvasElement).toDataURL()))
  }

  test('11 swatch berbeda di kedua tema', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await settled(page)
    await page.locator('.swatch-strip').scrollIntoViewIfNeeded()
    const light = await stripImages(page)
    expect(light).toHaveLength(11)
    expect(new Set(light).size).toBe(11)
    await page.getByRole('button', { name: 'Tema gelap' }).click()
    await page.waitForTimeout(100)
    const dark = await stripImages(page)
    expect(new Set(dark).size).toBe(11)
    expect(dark[0]).not.toBe(light[0])
  })

  test('hover memperagakan sekali lalu kembali diam', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')
    await settled(page)
    const link = page.locator('.swatch-link').first()
    await link.scrollIntoViewIfNeeded()
    const rest = await link.evaluate(canvasImage, 'canvas')
    await link.hover()
    await page.waitForTimeout(500)
    expect(await link.evaluate(canvasImage, 'canvas')).not.toBe(rest)
    await page.waitForTimeout(1200)
    expect(await link.evaluate(canvasImage, 'canvas')).toBe(rest)
  })

  test('Re-weave saat tech berganti di Teknologi', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/teknologi')
    await settled(page)
    const panel = page.locator('.tech-panel')
    await page.locator('.index-row').nth(3).hover()
    await page.waitForTimeout(150)
    const mid = await panel.evaluate(canvasImage, 'figure canvas')
    await page.waitForTimeout(600)
    const done = await panel.evaluate(canvasImage, 'figure canvas')
    expect(mid).not.toBe(done)
  })

  test('Ruler menunjuk nilai tinggi badan', async ({ page }) => {
    await page.goto('/size?tech=aezy&fit=Regular')
    await settled(page)
    await expect(page.locator('.ruler-needle')).toHaveCount(0)
    await page.getByLabel('Tinggi badan (cm)').fill('175')
    // 175 on a 140 to 210 scale is the middle
    await expect(page.locator('.ruler-needle-track')).toHaveAttribute('style', /translateX\(50%\)/)
    await expect(page.locator('tr[aria-current="true"] td').first()).toContainText('L')
  })

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' })

    test('swatch diam saat hover, Re-weave langsung jadi, ruler tanpa transisi', async ({
      page,
    }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto('/')
      await settled(page)
      const link = page.locator('.swatch-link').first()
      await link.scrollIntoViewIfNeeded()
      const rest = await link.evaluate(canvasImage, 'canvas')
      await link.hover()
      await page.waitForTimeout(300)
      expect(await link.evaluate(canvasImage, 'canvas')).toBe(rest)

      await page.goto('/teknologi')
      await settled(page)
      const panel = page.locator('.tech-panel')
      await page.locator('.index-row').nth(3).hover()
      await page.waitForTimeout(100)
      const first = await panel.evaluate(canvasImage, 'figure canvas')
      await page.waitForTimeout(500)
      expect(await panel.evaluate(canvasImage, 'figure canvas')).toBe(first)

      await page.goto('/size?tech=aezy&fit=Regular')
      await settled(page)
      await page.getByLabel('Tinggi badan (cm)').fill('175')
      const duration = await page
        .locator('.ruler-needle-track')
        .evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration))
      expect(duration).toBeLessThan(0.01)
    })
  })
})
