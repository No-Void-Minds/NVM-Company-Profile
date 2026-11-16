import { adminPage, expect, horizontalOverflow, settled, test, THEMES, useTheme } from './support'

// Phone layouts from the Sprint 22 UX audit (docs/audit-sprint22.md)
test.describe('Sprint 22 layout HP', () => {
  test('Produk 375: daftar per tech, setiap fit terlihat, tanpa matriks', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/produk')
    await settled(page)
    const list = page.getByTestId('tech-list')
    await expect(list).toBeVisible()
    await expect(page.locator('table')).toHaveCount(0)
    const aezy = list.locator('> li').filter({ hasText: 'AEZY™' }).first()
    await expect(aezy.getByRole('link', { name: /^Regular/ })).toBeVisible()
    await expect(aezy.getByRole('link', { name: /^Polo/ })).toBeVisible()
    // Fitted has no link yet and still shows, with a visible mark
    await expect(aezy.getByText('Fitted: Belum ada link')).toBeVisible()
    await expect(list.locator('> li').filter({ hasText: 'THERCO™' })).toContainText(
      'Tanpa pilihan fit',
    )
  })

  test('Produk 1024: matriks tetap untuk layar lebar', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 900 })
    await page.goto('/produk')
    await settled(page)
    await expect(page.locator('table')).toHaveCount(1)
    await expect(page.getByTestId('tech-list')).toHaveCount(0)
  })

  test('Size 375: setiap kolom terbaca saat digeser, kolom ukuran tetap terlihat', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/size?tech=aezy&fit=Regular')
    await settled(page)
    await page.locator('#size-height').fill('172')
    await expect(page.getByText('Geser tabel untuk melihat semua kolom.')).toBeVisible()
    const region = page.getByRole('region', { name: /Tabel size chart/ })
    const headers = region.locator('thead th')
    const count = await headers.count()
    expect(count).toBe(5)
    for (let i = 0; i < count; i++) {
      await headers.nth(i).scrollIntoViewIfNeeded()
      const inside = await headers.nth(i).evaluate((th) => {
        const box = th.getBoundingClientRect()
        const wrap = th.closest('[role="region"]')!.getBoundingClientRect()
        return box.left >= wrap.left - 1 && box.right <= wrap.right + 1
      })
      expect(inside, `kolom ${i + 1} terbaca`).toBe(true)
    }
    // Scrolled to the last column, the size column and the marked row are still in view
    const first = region.locator('tbody tr[data-selected="true"] td').first()
    const box = await first.boundingBox()
    const wrap = await region.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(wrap!.x - 1)
    await expect(first).toHaveText(/L/)
  })

  test('Size 375 dengan keyboard HP: hasil masuk layar, fokus tetap di isian', async ({ page }) => {
    // Half of a 812 px phone is taken by the on-screen keyboard
    await page.setViewportSize({ width: 375, height: 420 })
    await page.goto('/size?tech=aezy&fit=Regular')
    await settled(page)
    const input = page.locator('#size-height')
    await expect(input).toHaveAttribute('enterkeyhint', 'done')
    await input.fill('172')
    await input.press('Enter')
    const status = page.locator('p[role="status"][aria-live="polite"]')
    await expect(status).toContainText(/\bL\b/)
    await expect(status).toBeInViewport()
    await expect(status).toHaveAttribute('aria-live', 'polite')
    await expect(input).toBeFocused()
  })

  test('menu admin di HP: buka, Escape menutup, fokus kembali ke tombol', async ({ browser }) => {
    const { context, page } = await adminPage(browser, 375)
    await page.goto('/admin/inquiry')
    await settled(page)
    const button = page.getByRole('button', { name: 'Menu' })
    const nav = page.getByRole('navigation', { name: 'Menu admin' })
    await expect(page.getByRole('link', { name: 'Admin NVM' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Lihat situs' })).toBeVisible()
    await expect(nav).toBeHidden()
    const header = await page.locator('header').boundingBox()
    expect(header!.height).toBeLessThan(120)

    await button.click()
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(nav.getByRole('link', { name: 'Galeri' })).toBeVisible()
    await nav.getByRole('link', { name: 'Galeri' }).focus()
    await page.keyboard.press('Escape')
    await expect(nav).toBeHidden()
    await expect(button).toBeFocused()
    await expect(button).toHaveAttribute('aria-expanded', 'false')

    // A chosen page closes the menu as well
    await button.click()
    await nav.getByRole('link', { name: 'Log audit' }).click()
    await expect(page).toHaveURL(/\/admin\/audit$/)
    await expect(nav).toBeHidden()
    await expect(page.locator('#admin-main')).toBeFocused()
    await context.close()
  })

  // 25 page loads per theme, the same budget as the AC-13 loop in public.spec
  test.describe.configure({ timeout: 240_000 })
  for (const theme of THEMES) {
    test(`tanpa scroll horizontal di 320 sampai 1440, tema ${theme}`, async ({ browser }) => {
      const { context, page } = await adminPage(browser, 320)
      await useTheme(page, theme)
      const problems: string[] = []
      for (const width of [320, 375, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        for (const route of [
          '/produk',
          '/size?tech=aezy&fit=Regular',
          '/b2b',
          '/admin/inquiry',
          '/admin/katalog',
        ]) {
          await page.goto(route)
          await settled(page)
          if (route.startsWith('/admin') && width < 1024) {
            await page.getByRole('button', { name: 'Menu' }).click()
          }
          const overflow = await horizontalOverflow(page)
          if (overflow > 0) problems.push(`${width} ${route}: ${overflow}px`)
        }
      }
      expect(problems).toEqual([])
      await context.close()
    })
  }
})
