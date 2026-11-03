import AxeBuilder from '@axe-core/playwright'
import type { APIRequestContext, Page } from '@playwright/test'
import {
  adminPage,
  adminPassword,
  brightSignalUses,
  expect,
  horizontalOverflow,
  settled,
  smallTargets,
  test,
  THEMES,
  useTheme,
} from './support'

// The real lock needs Nginx, or serve-dist which copies it. The dev server only has the page.
const PROD = Boolean(process.env.E2E_BASE_URL)

test.describe.configure({ mode: 'serial' })

async function setGate(request: APIRequestContext, enabled: boolean) {
  const login = await request.post('/api/admin/login', {
    data: { username: 'uji-admin', password: adminPassword() },
  })
  expect(login.ok()).toBe(true)
  const { csrf_token: csrf } = await login.json()
  const put = await request.put('/api/admin/settings/password-gate', {
    headers: { 'X-CSRF-Token': csrf },
    data: { enabled },
  })
  expect(put.ok()).toBe(true)
  await request.post('/api/admin/logout', { headers: { 'X-CSRF-Token': csrf } })
}

async function fillLogin(page: Page, password: string) {
  await page.getByLabel('Username').fill('uji-admin')
  await page.getByLabel('Password').fill(password)
  await page.getByRole('button', { name: /Masuk ke situs|Enter the site/ }).click()
}

test.describe('FR-123 halaman password', () => {
  test('tampil di dua bahasa, tanpa header publik', async ({ page }) => {
    await page.goto('/password?next=/teknologi')
    await settled(page)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Situs sedang disiapkan')
    await expect(page.locator('html')).toHaveAttribute('lang', 'id')
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex')
    await expect(page.getByRole('navigation', { name: 'Menu utama' })).toHaveCount(0)
    await expect(page.getByLabel('Username')).toHaveAttribute('autocomplete', 'username')
    await expect(page.getByLabel('Password')).toHaveAttribute('type', 'password')

    // The language toggle keeps ?next, so the visitor still lands where they wanted
    await page.getByRole('link', { name: /Read this page in English/ }).click()
    await expect(page).toHaveURL(/\/en\/password\?next=\/teknologi$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The site is being prepared')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })

  test('isian kosong dan password salah dijelaskan dengan bahasa manusia', async ({ page }) => {
    await page.goto('/password')
    await settled(page)
    await page.getByRole('button', { name: 'Masuk ke situs' }).click()
    const live = page.locator('[aria-live="assertive"]')
    await expect(live).toContainText('Isi username dan password.')
    await expect(page.getByLabel('Username')).toBeFocused()

    // Answers are stubbed, so these cases do not spend the real login rate limit
    await page.route('**/api/admin/login', (route) =>
      route.fulfill({
        status: 401,
        json: { error: { code: 'UNAUTHORIZED', message: 'x' } },
      }),
    )
    await fillLogin(page, 'salah-sekali')
    await expect(live).toContainText('Username atau password salah')
    await expect(page.getByLabel('Password')).toHaveValue('')
    await expect(page.getByLabel('Password')).toHaveAttribute('aria-invalid', 'true')

    await page.unroute('**/api/admin/login')
    await page.route('**/api/admin/login', (route) =>
      route.fulfill({ status: 429, json: { error: { code: 'RATE_LIMITED', message: 'x' } } }),
    )
    await fillLogin(page, 'salah-lagi')
    await expect(live).toContainText('Terlalu banyak percobaan masuk')
  })

  test('FR-124 tujuan di luar situs diabaikan, login kembali ke Beranda', async ({ page }) => {
    await page.goto('/password?next=https%3A%2F%2Fevil.example%2Fcuri')
    await settled(page)
    await fillLogin(page, adminPassword())
    await expect(page).toHaveURL(/\/$/)
    expect(new URL(page.url()).host).not.toContain('evil')
  })

  test('FR-124 login kembali ke halaman yang diminta', async ({ page }) => {
    await page.goto('/en/password?next=%2Fen%2Fteknologi%23lab-curflex')
    await settled(page)
    await fillLogin(page, adminPassword())
    await expect(page).toHaveURL(/\/en\/teknologi#lab-curflex$/)
  })
})

test.describe('FR-123 halaman password di dua tema dan dua bahasa', () => {
  for (const theme of THEMES) {
    for (const path of ['/password', '/en/password']) {
      test(`${path} tema ${theme}: axe, 320 px, target 44 px`, async ({ page }) => {
        await useTheme(page, theme)
        const problems: string[] = []
        for (const width of [320, 1440]) {
          await page.setViewportSize({ width, height: 800 })
          await page.goto(path)
          await settled(page)
          // Light is the default and sets no attribute, so the dataset is read directly
          expect(await page.evaluate(() => document.documentElement.dataset.theme ?? 'light')).toBe(
            theme,
          )
          const overflow = await horizontalOverflow(page)
          if (overflow > 0) problems.push(`${width}: overflow ${overflow}px`)
          for (const small of await smallTargets(page)) problems.push(`${width}: kecil ${small}`)
          if (theme === 'light') {
            for (const use of await brightSignalUses(page))
              problems.push(`${width}: #FF5A36 ${use}`)
          }
          const axe = await new AxeBuilder({ page })
            .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
            .analyze()
          for (const v of axe.violations)
            problems.push(`${width}: axe ${v.id} ${v.nodes[0]?.target.join(' ')}`)
        }
        expect(problems).toEqual([])
      })
    }
  }

  test('keyboard: Tab ke username, password, tombol, Enter mengirim', async ({ page }) => {
    await page.route('**/api/admin/login', (route) =>
      route.fulfill({ status: 401, json: { error: { code: 'UNAUTHORIZED', message: 'x' } } }),
    )
    await page.goto('/password')
    await settled(page)
    await page.getByLabel('Username').focus()
    await page.keyboard.type('uji-admin')
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Password')).toBeFocused()
    await page.keyboard.type('salah-sekali')
    await page.keyboard.press('Enter')
    await expect(page.locator('[aria-live="assertive"]')).toContainText(
      'Username atau password salah',
    )
  })
})

test.describe('FR-125 saklar admin', () => {
  test('mengubah status lewat dialog, tercatat di audit', async ({ browser }) => {
    const { context, page } = await adminPage(browser)
    await page.goto('/admin/pengaturan')
    await settled(page)
    const status = page.locator('dd').first()
    await expect(status).toContainText('Mati, situs terbuka untuk semua orang')

    await page.getByRole('button', { name: 'Aktifkan halaman password' }).click()
    const dialog = page.getByRole('alertdialog')
    await expect(dialog).toContainText('Kunci situs dengan halaman password?')
    // Cancel changes nothing
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(status).toContainText('Mati')

    await page.getByRole('button', { name: 'Aktifkan halaman password' }).click()
    await dialog.getByRole('button', { name: 'Aktifkan halaman password' }).click()
    await expect(status).toContainText('Aktif, situs terkunci')
    await expect(page.locator('dd').nth(1)).toContainText('oleh uji-admin')
    await page.reload()
    await settled(page)
    await expect(page.locator('dd').first()).toContainText('Aktif, situs terkunci')

    await page.getByRole('button', { name: 'Matikan halaman password' }).click()
    await expect(page.getByRole('alertdialog')).toContainText('Buka situs untuk semua orang?')
    await page
      .getByRole('alertdialog')
      .getByRole('button', { name: 'Matikan halaman password' })
      .click()
    await expect(page.locator('dd').first()).toContainText('Mati, situs terbuka untuk semua orang')

    await page.goto('/admin/audit')
    await settled(page)
    await expect(page.getByRole('cell', { name: 'password-gate' }).first()).toBeVisible()
    await context.close()
  })
})

test.describe('FR-121, FR-122 situs terkunci (build produksi)', () => {
  test.skip(!PROD, 'Kunci dipasang oleh Nginx, di sini oleh serve-dist')

  test.beforeAll(async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL: process.env.E2E_BASE_URL })
    await setGate(request, true)
    await request.dispose()
  })

  test.afterAll(async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL: process.env.E2E_BASE_URL })
    await setGate(request, false)
    await request.dispose()
  })

  test('HTML dan API publik terkunci, aset dan admin tetap lewat', async ({ request }) => {
    for (const path of ['/', '/teknologi', '/en/produk', '/halaman-yang-tidak-ada']) {
      const res = await request.get(path)
      expect(res.status(), path).toBe(401)
      expect(res.headers()['cache-control'], path).toBe('private, no-store')
      expect(res.headers()['x-robots-tag'], path).toBe('noindex')
      const html = await res.text()
      expect(html, path).toContain('name="nvm-gate"')
      expect(html, path).toContain(path.startsWith('/en') ? 'lang="en"' : 'lang="id"')
    }
    for (const path of ['/api/techs?lang=id', '/api/lab-stats']) {
      const res = await request.get(path)
      expect(res.status(), path).toBe(401)
      expect((await res.json()).error.code, path).toBe('UNAUTHORIZED')
    }
    const inquiry = await request.post('/api/inquiries', { data: {} })
    expect(inquiry.status()).toBe(401)

    for (const path of [
      '/fonts/D-DIN.woff2',
      '/brand/nvm-logo.png',
      '/favicon.ico',
      '/favicon-32.png',
      '/apple-touch-icon.png',
      '/icon-192.png',
      '/icon-512.png',
      '/api/health',
      '/admin/login',
    ]) {
      expect((await request.get(path)).status(), path).toBe(200)
    }
    expect((await request.get('/password')).status()).toBe(200)
    expect((await request.get('/robots.txt')).ok()).toBe(true)
    expect(await (await request.get('/robots.txt')).text()).toContain('Disallow: /\n')
    expect((await request.get('/sitemap.xml')).status()).toBe(404)
  })

  test('alamat terkunci menampilkan password, login membuka halaman itu', async ({
    page,
    allowFailedRequests,
  }) => {
    // The locked page itself answers 401 by design (FR-121), and Chrome logs every 401
    allowFailedRequests.value = true
    const response = await page.goto('/teknologi#lab-formlock')
    expect(response?.status()).toBe(401)
    await settled(page)
    await expect(page).toHaveURL(/\/password\?next=%2Fteknologi%23lab-formlock$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Situs sedang disiapkan')
    await fillLogin(page, adminPassword())
    await expect(page).toHaveURL(/\/teknologi#lab-formlock$/)
    await settled(page)
    await expect(
      page.getByRole('heading', { level: 2, name: 'FORMLOCK™', exact: true }),
    ).toBeVisible()

    // Unlocked for this browser, but still kept out of caches and indexes while the gate is on
    const again = await page.request.get('/teknologi')
    expect(again.status()).toBe(200)
    expect(again.headers()['cache-control']).toBe('private, no-store')
    expect(again.headers()['x-robots-tag']).toBe('noindex')
    const api = await page.request.get('/api/techs?lang=id')
    expect(api.status()).toBe(200)
    expect(api.headers()['cache-control']).toBe('private, no-store')
  })

  test('dari admin, Lihat situs membuka Beranda tanpa diminta password lagi', async ({
    browser,
  }) => {
    const { context, page } = await adminPage(browser)
    await page.goto('/admin')
    await settled(page)
    const [response] = await Promise.all([
      page.waitForResponse((res) => new URL(res.url()).pathname === '/'),
      page.getByRole('link', { name: 'Lihat situs' }).click(),
    ])
    expect(response.status()).toBe(200)
    await settled(page)
    await expect(page).toHaveURL(/\/$/)
    await expect(page.locator('meta[name="nvm-gate"]')).toHaveCount(0)
    await expect(page.getByRole('heading', { level: 1 })).not.toHaveText('Situs sedang disiapkan')
    await context.close()
  })

  test('alamat Inggris memakai halaman password Inggris', async ({ page, allowFailedRequests }) => {
    // The locked page itself answers 401 by design (FR-121), and Chrome logs every 401
    allowFailedRequests.value = true
    await page.goto('/en/teknologi')
    await settled(page)
    await expect(page).toHaveURL(/\/en\/password\?next=%2Fen%2Fteknologi$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('The site is being prepared')
  })

  test('saat gate mati, header kembali normal', async ({ playwright }) => {
    const request = await playwright.request.newContext({ baseURL: process.env.E2E_BASE_URL })
    await setGate(request, false)
    const res = await request.get('/teknologi')
    expect(res.status()).toBe(200)
    expect(res.headers()['cache-control']).toBe('no-cache')
    expect(res.headers()['x-robots-tag']).toBeUndefined()
    expect((await request.get('/sitemap.xml')).status()).toBe(200)
    await setGate(request, true)
    await request.dispose()
  })
})
