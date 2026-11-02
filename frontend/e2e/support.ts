import { expect, test as base, type Browser, type Page } from '@playwright/test'

export const WIDTHS = [320, 375, 768, 1024, 1440]

export const PUBLIC_ROUTES = [
  '/',
  '/brand',
  '/teknologi',
  '/produk',
  '/b2b',
  '/galeri',
  '/testimoni',
  '/size',
  '/kontak',
  '/privasi',
  '/halaman-yang-tidak-ada',
]

export const ADMIN_ROUTES = [
  '/admin/inquiry',
  '/admin/galeri',
  '/admin/testimoni',
  '/admin/size-chart',
  '/admin/katalog',
  '/admin/audit',
]

// The API answers these on purpose (SRS 7.4), and Chrome logs every 4xx response
// as a console error that page code cannot silence. Anything else fails the test.
const EXPECTED_RESOURCE_ERRORS: Array<[RegExp, number]> = [
  [/\/api\/size-charts\//, 404],
  [/\/api\/admin\/me$/, 401],
  [/\/api\/admin\/login$/, 401],
  [/\/api\/inquiries$/, 429],
]

function isExpectedResourceError(text: string, url: string): boolean {
  return EXPECTED_RESOURCE_ERRORS.some(
    ([pattern, status]) => pattern.test(url) && text.includes(`status of ${status}`),
  )
}

export const test = base.extend<{ consoleGuard: void; allowFailedRequests: { value: boolean } }>({
  // Playwright requires the destructuring pattern even when it is empty.
  // eslint-disable-next-line no-empty-pattern
  allowFailedRequests: async ({}, use) => {
    await use({ value: false })
  },
  consoleGuard: [
    async ({ page, allowFailedRequests }, use) => {
      const problems: string[] = []
      page.on('pageerror', (error) => problems.push(`pageerror: ${error.message}`))
      page.on('console', (message) => {
        if (message.type() !== 'error' && message.type() !== 'warning') return
        const url = message.location().url
        if (isExpectedResourceError(message.text(), url)) return
        if (allowFailedRequests.value && message.text().includes('Failed to load resource')) return
        problems.push(`${message.type()} ${page.url()}: ${message.text()} (${url})`)
      })
      await use()
      expect(problems, 'console harus bersih').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }

export function adminPassword(): string {
  const password = process.env.UJI_ADMIN_PASSWORD
  if (!password) throw new Error('UJI_ADMIN_PASSWORD belum diset')
  return password
}

export async function login(page: Page) {
  await page.goto('/admin/login')
  await page.getByLabel('Username').fill('uji-admin')
  await page.getByLabel('Password').fill(adminPassword())
  await page.getByRole('button', { name: 'Masuk ke panel admin' }).click()
  await expect(page.getByRole('heading', { name: 'Inquiry B2B' })).toBeVisible()
}

// Logs in once: the login limit is 10 per 15 minutes and each test would burn one.
let savedState: Awaited<
  ReturnType<import('@playwright/test').BrowserContext['storageState']>
> | null = null

export async function adminPage(browser: Browser, width = 1440) {
  if (!savedState) {
    const context = await browser.newContext()
    const page = await context.newPage()
    await login(page)
    savedState = await context.storageState()
    await context.close()
  }
  const context = await browser.newContext({
    storageState: savedState,
    viewport: { width, height: 900 },
    acceptDownloads: true,
    baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5175',
  })
  return { context, page: await context.newPage() }
}

export async function settled(page: Page) {
  await page.waitForLoadState('networkidle')
  await expect(page.locator('[role="status"].knit-bg')).toHaveCount(0)
}

export async function horizontalOverflow(page: Page): Promise<number> {
  return page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
}

// Inline links inside a sentence are exempt, the same way WCAG 2.5.8 exempts them.
export async function smallTargets(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = []
    const items = document.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, summary, [role="tab"]',
    )
    for (const el of items) {
      if (el.closest('.honeypot, .skip-link') || el.classList.contains('skip-link')) continue
      const box = (el.closest('label') ?? el) as HTMLElement
      const rect = box.getBoundingClientRect()
      if (rect.width === 0 || rect.height === 0) continue
      if (getComputedStyle(el).visibility === 'hidden') continue
      if (el.tagName === 'A' && getComputedStyle(el).display === 'inline') continue
      if (rect.width < 44 || rect.height < 44) {
        const label = (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40)
        out.push(`${el.tagName} "${label}" ${Math.round(rect.width)}x${Math.round(rect.height)}`)
      }
    }
    return out
  })
}

export async function focusRing(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null
    if (!el || el === document.body) return { tag: 'BODY', ok: false, text: '' }
    const style = getComputedStyle(el)
    return {
      tag: el.tagName,
      text: (el.getAttribute('aria-label') ?? el.textContent ?? '').trim().slice(0, 40),
      ok:
        style.outlineStyle === 'solid' &&
        style.outlineWidth === '2px' &&
        style.outlineColor === 'rgb(255, 90, 54)',
    }
  })
}

export const UJI_IMAGE = {
  name: 'uji.png',
  mimeType: 'image/png',
  // 1x1 PNG, enough for the upload pipeline.
  buffer: Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    'base64',
  ),
}
