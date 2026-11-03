import {
  createRouter,
  type RouteRecordRaw,
  type RouterHistory,
  type RouterScrollBehavior,
} from 'vue-router'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import { setUnauthorizedHandler } from '@/api/client'
import { useSession } from '@/composables/useSession'
import type { PageKey } from '@/i18n'
import HomePage from '@/pages/HomePage.vue'

declare module 'vue-router' {
  interface RouteMeta {
    // Public pages take title and description from the dictionary of the path language
    page?: PageKey
    // Admin pages stay Indonesian (FR-118) and carry their own text
    title?: string
    description?: string
    requiresAdmin?: boolean
  }
}

// Keep in sync with ROUTES in scripts/prerender.mjs and publicRoutes in the backend.
const PUBLIC_PAGES: Array<{ path: string; page: PageKey; component: RouteRecordRaw['component'] }> =
  [
    { path: '', page: 'home', component: HomePage },
    { path: 'brand', page: 'brand', component: () => import('@/pages/BrandPage.vue') },
    { path: 'teknologi', page: 'tech', component: () => import('@/pages/TechPage.vue') },
    { path: 'produk', page: 'product', component: () => import('@/pages/ProductPage.vue') },
    { path: 'b2b', page: 'b2b', component: () => import('@/pages/B2BPage.vue') },
    { path: 'galeri', page: 'gallery', component: () => import('@/pages/GalleryPage.vue') },
    {
      path: 'testimoni',
      page: 'testimonial',
      component: () => import('@/pages/TestimonialPage.vue'),
    },
    { path: 'size', page: 'size', component: () => import('@/pages/SizePage.vue') },
    { path: 'kontak', page: 'contact', component: () => import('@/pages/ContactPage.vue') },
    { path: 'privasi', page: 'privacy', component: () => import('@/pages/PrivacyPage.vue') },
    {
      path: ':pathMatch(.*)*',
      page: 'notFound',
      component: () => import('@/pages/NotFoundPage.vue'),
    },
  ]

function publicPages(): RouteRecordRaw[] {
  return PUBLIC_PAGES.map(({ path, page, component }) => ({
    path,
    component,
    meta: { page },
  })) as RouteRecordRaw[]
}

const adminMeta = (title: string) => ({
  title: `${title}, Admin`,
  description: 'Panel admin No Void Minds.',
  requiresAdmin: true,
})

const routes: RouteRecordRaw[] = [
  {
    path: '/admin/login',
    component: () => import('@/pages/admin/AdminLogin.vue'),
    meta: { title: 'Masuk admin', description: 'Panel admin No Void Minds.' },
  },
  {
    path: '/admin',
    component: () => import('@/components/layout/AdminLayout.vue'),
    redirect: '/admin/inquiry',
    children: [
      {
        path: 'inquiry',
        component: () => import('@/pages/admin/AdminInquiries.vue'),
        meta: adminMeta('Inquiry'),
      },
      {
        path: 'galeri',
        component: () => import('@/pages/admin/AdminGallery.vue'),
        meta: adminMeta('Galeri'),
      },
      {
        path: 'testimoni',
        component: () => import('@/pages/admin/AdminTestimonials.vue'),
        meta: adminMeta('Testimoni'),
      },
      {
        path: 'size-chart',
        component: () => import('@/pages/admin/AdminSizeCharts.vue'),
        meta: adminMeta('Size chart'),
      },
      {
        path: 'katalog',
        component: () => import('@/pages/admin/AdminCatalog.vue'),
        meta: adminMeta('Tech dan collab'),
      },
      {
        path: 'audit',
        component: () => import('@/pages/admin/AdminAudit.vue'),
        meta: adminMeta('Log audit'),
      },
      {
        path: 'pengaturan',
        component: () => import('@/pages/admin/AdminSettings.vue'),
        meta: adminMeta('Pengaturan'),
      },
    ],
  },
  // The site gate stands alone, without the public header and its links (FR-123).
  {
    path: '/password',
    component: () => import('@/pages/PasswordPage.vue'),
    meta: { page: 'password' },
  },
  {
    path: '/en/password',
    component: () => import('@/pages/PasswordPage.vue'),
    meta: { page: 'password' },
  },
  // Indonesian lives at the root and English under /en (FR-110), from one page list.
  { path: '/en', component: PublicLayout, children: publicPages() },
  { path: '/', component: PublicLayout, children: publicPages() },
]

const scrollBehavior: RouterScrollBehavior = (to, from, saved) => {
  if (saved) return saved
  if (to.hash) return false
  if (to.path === from.path) return false
  return { top: 0 }
}

export function createAppRouter(history: RouterHistory) {
  const router = createRouter({ history, routes, scrollBehavior })
  const session = useSession()

  router.beforeEach(async (to) => {
    if (!to.path.startsWith('/admin')) return true
    await session.ensure()
    if (to.meta.requiresAdmin && !session.username.value) {
      return { path: '/admin/login', query: { next: to.fullPath } }
    }
    if (to.path === '/admin/login' && session.username.value) return '/admin'
    return true
  })

  setUnauthorizedHandler(() => {
    session.clear()
    const current = router.currentRoute.value
    if (current.path !== '/admin/login') {
      void router.push({ path: '/admin/login', query: { next: current.fullPath } })
    }
  })

  return router
}
