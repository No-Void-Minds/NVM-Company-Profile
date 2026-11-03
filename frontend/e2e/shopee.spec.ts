import AxeBuilder from '@axe-core/playwright'
import {
  adminPage,
  expect,
  horizontalOverflow,
  settled,
  smallTargets,
  test,
  THEMES,
  useTheme,
} from './support'

// Sprint 19: every buy link goes to Shopee (FR-130 to FR-138)
const AEZY_REGULAR =
  'https://shopee.co.id/No-Void-Minds-AEZY-Regular-T-Shirt-Core-i.462123491.25438116155'
const AEZY_POLO = 'https://shopee.co.id/No-Void-Minds-AEZY-Polo-Shirt-Core-i.462123491.41081865803'
const THERCO =
  'https://shopee.co.id/No-Void-Minds-Therco-Pullover-Hoodie-Agave-i.462123491.46863037318'

test.describe('FR-130, FR-131 tanpa Shopify', () => {
  for (const path of ['/', '/en']) {
    test(`${path}: header tanpa tombol belanja, hero ke toko Shopee`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await page.goto(path)
      await settled(page)
      const header = page.getByRole('banner')
      await expect(
        header.getByRole('link', { name: /Shopify|Shopee|Belanja|Shop on/ }),
      ).toHaveCount(0)
      const name = path === '/' ? 'Belanja di Shopee' : 'Shop on Shopee'
      const hero = page.getByRole('main').getByRole('link', { name })
      await expect(hero).toHaveAttribute('href', 'https://shopee.co.id/novoidminds')
      await expect(hero).toHaveAttribute('target', '_blank')
      await expect(hero).toHaveAttribute('rel', 'noopener noreferrer')
      await expect(hero).toContainText(path === '/' ? '(buka di tab baru)' : '(opens in a new tab)')
      expect((await page.content()).toLowerCase()).not.toContain('shopify')
    })
  }

  test('menu HP tanpa tombol belanja', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 800 })
    await page.goto('/')
    await settled(page)
    await page.getByRole('button', { name: 'Buka menu' }).click()
    const menu = page.getByRole('dialog', { name: 'Menu utama' })
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('link', { name: /Shopify|Shopee|Belanja/ })).toHaveCount(0)
  })
})

test.describe('FR-132 matriks Produk', () => {
  test('Lihat hanya bila ada link, fit tanpa link tampil "-"', async ({ page }) => {
    await page.goto('/produk')
    await settled(page)
    const aezy = page.locator('tr', { has: page.getByRole('link', { name: 'AEZY™', exact: true }) })
    const regular = aezy.getByRole('link', {
      name: 'Lihat AEZY™ Regular di Shopee (buka di tab baru)',
    })
    await expect(regular).toHaveAttribute('href', AEZY_REGULAR)
    await expect(regular).toHaveAttribute('target', '_blank')
    await expect(regular).toHaveAttribute('rel', 'noopener noreferrer')
    // AEZY Fitted exists as a fit but has no link yet
    await expect(aezy.getByRole('link', { name: /Fitted/ })).toHaveCount(0)
    await expect(aezy.getByText('Belum ada link')).toHaveCount(1)
    await expect(aezy.getByRole('link', { name: /di Shopee/ })).toHaveCount(2)

    const therco = page.locator('tr', { has: page.getByRole('link', { name: 'THERCO™' }) })
    await expect(
      therco.getByRole('link', {
        name: 'Lihat THERCO™ di Shopee, tanpa pilihan fit (buka di tab baru)',
      }),
    ).toHaveAttribute('href', THERCO)

    await expect(page.getByRole('link', { name: 'MELTWRAP™' })).toHaveCount(0)
    await expect(page.locator('tbody tr')).toHaveCount(10)
    // Seeded collabs have no link: plain text, Coming soon unchanged
    const marvel = page.getByRole('listitem').filter({ hasText: 'Marvel' })
    await expect(marvel.getByRole('link')).toHaveCount(0)
  })

  test('versi Inggris', async ({ page }) => {
    await page.goto('/en/produk')
    await settled(page)
    await expect(
      page.getByRole('link', { name: 'See AEZY™ Polo on Shopee (opens in a new tab)' }),
    ).toHaveAttribute('href', AEZY_POLO)
    await expect(page.getByText('No link yet').first()).toBeAttached()
  })
})

test.describe('FR-133 link per fit di Teknologi', () => {
  test('AEZY punya Regular dan Polo, THERCO satu link, tanpa Fitted', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/teknologi#lab-aezy')
    await settled(page)
    const panel = page.locator('article')
    await expect(panel.getByText('Beli di Shopee')).toBeVisible()
    const links = panel.getByRole('link', { name: /di Shopee/ })
    await expect(links).toHaveText(['Regular', 'Polo'])
    await expect(
      panel.getByRole('link', { name: 'Regular AEZY™ di Shopee (buka di tab baru)' }),
    ).toHaveAttribute('href', AEZY_REGULAR)

    await page.goto('/teknologi#lab-therco')
    await settled(page)
    const one = page.locator('article').getByRole('link', { name: /Lihat di Shopee/ })
    await expect(one).toHaveAttribute('href', THERCO)
    await expect(one).toHaveAttribute('rel', 'noopener noreferrer')
  })

  test('versi Inggris memakai label fit yang sama', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/en/teknologi#lab-aezy')
    await settled(page)
    await expect(page.locator('article').getByText('Buy on Shopee')).toBeVisible()
    await expect(
      page.getByRole('link', { name: 'Polo AEZY™ on Shopee (opens in a new tab)' }),
    ).toHaveAttribute('href', AEZY_POLO)
  })
})

test.describe('FR-134 MELTWRAP tersembunyi', () => {
  test('tidak ada di API, Teknologi, Size, B2B, dan Lab index 10', async ({ page, request }) => {
    for (const lang of ['id', 'en']) {
      const techs = await (await request.get(`/api/techs?lang=${lang}`)).json()
      expect(techs.map((t: { key: string }) => t.key)).not.toContain('meltwrap')
      expect(techs).toHaveLength(10)
    }
    expect((await (await request.get('/api/lab-stats')).json()).systems).toBe(10)

    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/teknologi#lab-meltwrap')
    await settled(page)
    await expect(page.getByText('MELTWRAP')).toHaveCount(0)
    await expect(page.locator('.index-row')).toHaveCount(10)
    await expect(page.locator('.index-row').last()).toContainText('10')
    // Your day filter: soft counted MELTWRAP before, now AEZY COTTON and PUFFMAX only
    await page.getByRole('button', { name: 'Ingin yang lembut' }).click()
    await expect(page.getByText('02 cocok')).toBeVisible()

    await page.goto('/size')
    await settled(page)
    await expect(page.getByLabel('Tech').locator('option', { hasText: 'MELTWRAP' })).toHaveCount(0)

    await page.goto('/')
    await settled(page)
    await expect(page.locator('dd').first()).toHaveText('10')
  })
})

test.describe('FR-136, FR-137 admin link Shopee', () => {
  test('link collab diisi admin lalu tampil di Produk, link asing ditolak', async ({ browser }) => {
    const collabUrl = 'https://shopee.co.id/novoidminds?shopCollection=123456789'
    const { context, page } = await adminPage(browser)
    await page.goto('/admin/katalog')
    await settled(page)
    const marvel = page.locator('li[data-collab="marvel"]')
    const field = marvel.getByLabel('Link koleksi Shopee')

    // Rejected in the browser before any request
    await field.fill('https://shopee.co.id.evil.com/x')
    await marvel.getByRole('button', { name: 'Simpan link Marvel' }).click()
    await expect(marvel.getByText('Link harus ke shopee.co.id.')).toBeVisible()

    // The backend rejects the same link when the browser check is skipped
    const csrf = await page.evaluate(async () => {
      const me = await fetch('/api/admin/me').then((r) => r.json())
      return me.csrf_token as string
    })
    for (const url of [
      'javascript:alert(1)',
      'http://shopee.co.id/x',
      'https://shopee.co.id@evil.com/x',
    ]) {
      const res = await page.request.patch('/api/admin/collabs/marvel', {
        headers: { 'X-CSRF-Token': csrf },
        data: { url },
      })
      expect(res.status(), url).toBe(400)
      expect((await res.json()).error.fields.url, url).toBeTruthy()
    }

    try {
      await field.fill(collabUrl)
      await marvel.getByRole('button', { name: 'Simpan link Marvel' }).click()
      await expect(page.getByText('Link Marvel tersimpan.')).toBeVisible()
      await expect(field).toHaveValue(collabUrl)

      const visitor = await browser.newContext({
        baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5175',
      })
      const pub = await visitor.newPage()
      await pub.goto('/produk')
      await settled(pub)
      const link = pub.getByRole('link', { name: 'Marvel (buka di tab baru)' })
      // Stored as typed, the collection query stays
      await expect(link).toHaveAttribute('href', collabUrl)
      await expect(link).toHaveAttribute('rel', 'noopener noreferrer')
      await visitor.close()

      await page.goto('/admin/audit')
      await settled(page)
      await expect(page.getByRole('cell', { name: 'marvel', exact: true }).first()).toBeVisible()
    } finally {
      const res = await page.request.patch('/api/admin/collabs/marvel', {
        headers: { 'X-CSRF-Token': csrf },
        data: { url: '' },
      })
      expect(res.ok()).toBe(true)
      await context.close()
    }
  })

  test('saklar tampil, link per fit, respons no-store', async ({ browser }) => {
    const { context, page } = await adminPage(browser)
    await page.goto('/admin/katalog')
    await settled(page)
    const meltwrap = page.locator('li[data-tech="meltwrap"]')
    await expect(meltwrap.getByText('Tersembunyi')).toBeVisible()
    await expect(meltwrap.getByLabel('Tampil di situs')).not.toBeChecked()
    await expect(meltwrap.getByLabel('Link Shopee (tanpa fit)')).toHaveValue('')

    const aezy = page.locator('li[data-tech="aezy"]')
    await expect(aezy.getByLabel('Link Shopee Regular')).toHaveValue(AEZY_REGULAR)
    await expect(aezy.getByLabel('Link Shopee Fitted')).toHaveValue('')
    await aezy.getByLabel('Link Shopee Fitted').fill('http://shopee.co.id/x')
    await aezy.getByRole('button', { name: 'Simpan link AEZY™' }).click()
    await expect(aezy.getByText('Link harus diawali https://')).toBeVisible()
    await aezy.getByLabel('Link Shopee Fitted').fill('')

    const res = await page.request.get('/api/admin/techs')
    expect(res.headers()['cache-control']).toBe('no-store')
    const all = await res.json()
    expect(all).toHaveLength(11)
    expect(all.find((t: { key: string }) => t.key === 'meltwrap').visible).toBe(false)
    await context.close()
  })
})

test.describe('FR-132 Produk dan Teknologi di dua tema dan dua bahasa', () => {
  for (const theme of THEMES) {
    for (const path of [
      '/produk',
      '/en/produk',
      '/teknologi#lab-aezy',
      '/en/teknologi#lab-therco',
    ]) {
      test(`${path} tema ${theme}: axe, 320 px, target 44 px`, async ({ page }) => {
        await useTheme(page, theme)
        await page.setViewportSize({ width: 320, height: 800 })
        await page.goto(path)
        await settled(page)
        expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0)
        expect(await smallTargets(page)).toEqual([])
        const axe = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze()
        expect(axe.violations.map((v) => `${v.id} ${v.nodes[0]?.target.join(' ')}`)).toEqual([])
        expect((await page.content()).toLowerCase()).not.toContain('shopify')
      })
    }
  }
})

test.describe('FR-134 jumlah material system dari data', () => {
  const metaDescription = (page: import('@playwright/test').Page) =>
    page.locator('meta[name="description"]')

  test('menyembunyikan FLEXE lewat admin mengubah angka di Beranda, Teknologi, dan meta', async ({
    browser,
  }) => {
    const { context, page } = await adminPage(browser)
    await page.goto('/admin/katalog')
    await settled(page)
    const flexe = page.locator('li[data-tech="flexe"]').getByLabel('Tampil di situs')
    await expect(flexe).toBeChecked()
    try {
      await flexe.click()
      await expect(flexe).not.toBeChecked()
      await expect(page.locator('li[data-tech="flexe"]').getByText('Tersembunyi')).toBeVisible()

      const visitor = await browser.newContext({
        baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5175',
      })
      const pub = await visitor.newPage()
      await pub.goto('/')
      await settled(pub)
      await expect(pub.locator('dd').first()).toHaveText('09')
      await expect(pub.getByRole('link', { name: 'Lihat 9 material system' })).toBeVisible()
      await expect(metaDescription(pub)).toHaveAttribute('content', /Kenali 9 material system,/)

      await pub.goto('/teknologi')
      await settled(pub)
      await expect(pub.locator('.index-row')).toHaveCount(9)
      await expect(pub.getByText('09 cocok')).toBeVisible()
      await expect(metaDescription(pub)).toHaveAttribute(
        'content',
        /^Index 9 material system NVM\./,
      )

      await pub.goto('/en/teknologi')
      await settled(pub)
      await expect(metaDescription(pub)).toHaveAttribute(
        'content',
        /^The index of 9 NVM material systems\./,
      )
      await pub.goto('/en')
      await settled(pub)
      await expect(pub.getByRole('link', { name: 'See the 9 material systems' })).toBeVisible()
      await visitor.close()
    } finally {
      await page.goto('/admin/katalog')
      await settled(page)
      if (!(await flexe.isChecked())) await flexe.click()
      await expect(flexe).toBeChecked()
      await context.close()
    }
  })

  test('angka kembali 10 setelah FLEXE tampil lagi', async ({ page }) => {
    await page.goto('/')
    await settled(page)
    await expect(page.locator('dd').first()).toHaveText('10')
    await expect(page.getByRole('link', { name: 'Lihat 10 material system' })).toBeVisible()
    await expect(metaDescription(page)).toHaveAttribute('content', /Kenali 10 material system,/)
  })

  // The static HTML cannot know a count the admin may change later, so it has none
  test('HTML prerender tanpa angka tetap', async ({ request }) => {
    test.skip(!process.env.E2E_BASE_URL, 'Prerender hanya ada di build produksi')
    for (const [path, texts] of [
      ['/', ['Kenali material system NVM,', 'Lihat semua material system']],
      ['/teknologi', ['Index material system NVM.']],
      ['/en', ['Meet the material systems,', 'See all material systems']],
      ['/en/teknologi', ['The index of NVM material systems.']],
    ] as const) {
      const html = await (await request.get(path)).text()
      for (const text of texts) expect(html, `${path}: ${text}`).toContain(text)
      expect(html, path).not.toMatch(/\d+ (NVM )?material systems?/)
      expect(html, path).not.toMatch(/AEZY (sampai|to) /)
    }
  })
})
