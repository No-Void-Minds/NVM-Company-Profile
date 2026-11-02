import type {
  AdminGalleryItem,
  AdminSession,
  AdminTestimonial,
  AuditEntry,
  Collab,
  GalleryItem,
  Inquiry,
  InquiryInput,
  InquiryStatus,
  LabStats,
  SizeChart,
  Tech,
  Testimonial,
} from './types'

const FALLBACK_MESSAGE = 'Terjadi kesalahan. Coba lagi sebentar.'

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
    readonly fields: Record<string, string> = {},
  ) {
    super(message)
  }
}

let csrfToken = ''
let onUnauthorized: (() => void) | null = null

export function setCsrfToken(token: string) {
  csrfToken = token
}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

interface RequestOptions {
  method?: string
  json?: unknown
  form?: FormData
  headers?: Record<string, string>
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = { ...options.headers }
  if (options.json !== undefined) headers['Content-Type'] = 'application/json'
  if (method !== 'GET' && path.startsWith('/api/admin/') && csrfToken) {
    headers['X-CSRF-Token'] = csrfToken
  }

  let response: Response
  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: 'same-origin',
      body: options.form ?? (options.json !== undefined ? JSON.stringify(options.json) : undefined),
    })
  } catch {
    throw new ApiError(
      0,
      'NETWORK',
      'Tidak bisa terhubung ke server. Periksa koneksi, lalu coba lagi.',
    )
  }

  if (response.status === 204) return undefined as T
  if (response.ok) return (await response.json()) as T

  const failure = await parseFailure(response)
  // Login reports wrong passwords as 401 too, and that must stay on the form.
  if (response.status === 401 && path !== '/api/admin/login' && path !== '/api/admin/me') {
    onUnauthorized?.()
  }
  throw failure
}

async function parseFailure(response: Response): Promise<ApiError> {
  try {
    const body = (await response.json()) as {
      error?: { code?: string; message?: string; fields?: Record<string, string> }
    }
    return new ApiError(
      response.status,
      body.error?.code ?? 'INTERNAL',
      body.error?.message ?? FALLBACK_MESSAGE,
      body.error?.fields ?? {},
    )
  } catch {
    // Nginx answers 502 with HTML while the backend is down.
    return new ApiError(response.status, 'INTERNAL', FALLBACK_MESSAGE)
  }
}

// Tech copy and gallery text come in the page language (FR-113, FR-115).
export const api = {
  techs: (lang: 'id' | 'en') => request<Tech[]>(`/api/techs?lang=${lang}`),
  collabs: () => request<Collab[]>('/api/collabs'),
  labStats: () => request<LabStats>('/api/lab-stats'),
  gallery: (lang: 'id' | 'en') => request<GalleryItem[]>(`/api/gallery?lang=${lang}`),
  testimonials: () => request<Testimonial[]>('/api/testimonials'),
  sizeChart: (key: string) => request<SizeChart>(`/api/size-charts/${encodeURIComponent(key)}`),
  createInquiry: (input: InquiryInput, idempotencyKey: string) =>
    request<{ code: string }>('/api/inquiries', {
      method: 'POST',
      json: input,
      headers: { 'Idempotency-Key': idempotencyKey },
    }),
}

export const adminApi = {
  login: (username: string, password: string) =>
    request<AdminSession>('/api/admin/login', { method: 'POST', json: { username, password } }),
  logout: () => request<void>('/api/admin/logout', { method: 'POST' }),
  me: () => request<AdminSession>('/api/admin/me'),
  auditLog: () => request<AuditEntry[]>('/api/admin/audit-log'),

  gallery: () => request<AdminGalleryItem[]>('/api/admin/gallery'),
  createGallery: (form: FormData) =>
    request<AdminGalleryItem>('/api/admin/gallery', { method: 'POST', form }),
  updateGallery: (id: string, patch: Partial<AdminGalleryItem>) =>
    request<AdminGalleryItem>(`/api/admin/gallery/${id}`, { method: 'PATCH', json: patch }),
  deleteGallery: (id: string) => request<void>(`/api/admin/gallery/${id}`, { method: 'DELETE' }),

  testimonials: () => request<AdminTestimonial[]>('/api/admin/testimonials'),
  createTestimonial: (form: FormData) =>
    request<AdminTestimonial>('/api/admin/testimonials', { method: 'POST', form }),
  updateTestimonial: (id: string, patch: Partial<AdminTestimonial>) =>
    request<AdminTestimonial>(`/api/admin/testimonials/${id}`, { method: 'PATCH', json: patch }),
  deleteTestimonial: (id: string) =>
    request<void>(`/api/admin/testimonials/${id}`, { method: 'DELETE' }),

  sizeCharts: () => request<SizeChart[]>('/api/admin/size-charts'),
  putSizeChart: (key: string, chart: Pick<SizeChart, 'title' | 'rows' | 'note'>) =>
    request<SizeChart>(`/api/admin/size-charts/${encodeURIComponent(key)}`, {
      method: 'PUT',
      json: chart,
    }),
  deleteSizeChart: (key: string) =>
    request<void>(`/api/admin/size-charts/${encodeURIComponent(key)}`, { method: 'DELETE' }),

  // Admin pages read these instead of the public routes, which are cached for 60 seconds.
  techs: () => request<Tech[]>('/api/admin/techs'),
  collabs: () => request<Collab[]>('/api/admin/collabs'),
  setTechOnRack: (key: string, onRack: boolean) =>
    request<Tech>(`/api/admin/techs/${key}`, { method: 'PATCH', json: { on_rack: onRack } }),
  setCollabAvailable: (key: string, available: boolean) =>
    request<Collab>(`/api/admin/collabs/${key}`, { method: 'PATCH', json: { available } }),

  inquiries: (filter: { kind?: string; status?: string }) => {
    const query = new URLSearchParams()
    if (filter.kind) query.set('kind', filter.kind)
    if (filter.status) query.set('status', filter.status)
    return request<Inquiry[]>(`/api/admin/inquiries?${query}`)
  },
  setInquiryStatus: (id: string, status: InquiryStatus) =>
    request<Inquiry>(`/api/admin/inquiries/${id}`, { method: 'PATCH', json: { status } }),
}

export function errorMessage(error: unknown): string {
  return error instanceof ApiError ? error.message : FALLBACK_MESSAGE
}
