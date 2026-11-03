import { request, type FullConfig } from '@playwright/test'

// Migration 0004 starts with the password gate on. The other suites test the open site,
// so the gate is switched off once here, and gate.spec.ts turns it on where it needs it.
export default async function globalSetup(config: FullConfig) {
  const password = process.env.UJI_ADMIN_PASSWORD
  if (!password) throw new Error('UJI_ADMIN_PASSWORD belum diset')
  const baseURL = config.projects[0].use.baseURL
  const api = await request.newContext({ baseURL })
  const login = await api.post('/api/admin/login', { data: { username: 'uji-admin', password } })
  if (!login.ok()) throw new Error(`login uji-admin gagal: ${login.status()}`)
  const { csrf_token: csrf } = (await login.json()) as { csrf_token: string }
  const put = await api.put('/api/admin/settings/password-gate', {
    headers: { 'X-CSRF-Token': csrf },
    data: { enabled: false },
  })
  if (put.status() === 404 || put.status() >= 500) {
    throw new Error(`gate tidak bisa diatur (${put.status()}), migrasi 0004 sudah jalan?`)
  }
  await api.post('/api/admin/logout', { headers: { 'X-CSRF-Token': csrf } })
  await api.dispose()
}
