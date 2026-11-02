import {
  createRouter,
  type RouteRecordRaw,
  type RouterHistory,
  type RouterScrollBehavior,
} from 'vue-router'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import { setUnauthorizedHandler } from '@/api/client'
import type { HeadMeta } from '@/composables/useHead'
import { useSession } from '@/composables/useSession'
import HomePage from '@/pages/HomePage.vue'

declare module 'vue-router' {
  interface RouteMeta extends Partial<HeadMeta> {
    requiresAdmin?: boolean
  }
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
    ],
  },
  {
    path: '/',
    component: PublicLayout,
    children: [
      {
        path: '',
        component: HomePage,
        meta: {
          title: 'No Void Minds',
          description:
            'No Void Minds membangun technical everyday wear dari materialnya dulu. Kenali 11 material system, lini Core dan Graphic, serta peluang kerja sama B2B.',
        },
      },
      {
        path: 'brand',
        component: () => import('@/pages/BrandPage.vue'),
        meta: {
          title: 'Brand',
          description:
            'Cara No Void Minds bekerja: engineered to perfection, fabric first, dan tiga tahap membuat sebuah material system. Berdiri 2021 di Bandung.',
        },
      },
      {
        path: 'teknologi',
        component: () => import('@/pages/TechPage.vue'),
        meta: {
          title: 'Teknologi',
          description:
            'Index 11 material system NVM, dari AEZY sampai MELTWRAP. Saring berdasarkan kebutuhan harianmu, lalu lihat fitur dan fit yang tersedia.',
        },
      },
      {
        path: 'produk',
        component: () => import('@/pages/ProductPage.vue'),
        meta: {
          title: 'Produk',
          description:
            'Beda lini Core dan Graphic. Core dipilih dari tech dan fit, Graphic dari daftar collab karakter berlisensi.',
        },
      },
      {
        path: 'b2b',
        component: () => import('@/pages/B2BPage.vue'),
        meta: {
          title: 'B2B',
          description:
            'Dua jalur kerja sama dengan NVM: Wholesale untuk toko dan reseller, Collaboration untuk brand, komunitas, dan tim. Kirim inquiry lewat formulir.',
        },
      },
      {
        path: 'galeri',
        component: () => import('@/pages/GalleryPage.vue'),
        meta: {
          title: 'Galeri',
          description: 'Foto lookbook, produksi, dan event No Void Minds.',
        },
      },
      {
        path: 'testimoni',
        component: () => import('@/pages/TestimonialPage.vue'),
        meta: {
          title: 'Testimoni',
          description:
            'Tangkapan layar ulasan pembeli NVM dari Shopee dan TikTok Shop, lengkap dengan transkrip teks.',
        },
      },
      {
        path: 'size',
        component: () => import('@/pages/SizePage.vue'),
        meta: {
          title: 'Size',
          description:
            'Cari ukuran NVM dari tinggi badan atau dari kaos favoritmu, memakai size chart resmi per tech dan fit.',
        },
      },
      {
        path: 'kontak',
        component: () => import('@/pages/ContactPage.vue'),
        meta: {
          title: 'Kontak',
          description:
            'Hubungi tim NVM lewat WhatsApp untuk tanya tech, wholesale, atau collaboration.',
        },
      },
      {
        path: 'privasi',
        component: () => import('@/pages/PrivacyPage.vue'),
        meta: {
          title: 'Kebijakan Privasi',
          description:
            'Data apa yang NVM simpan dari formulir B2B, tujuannya, lama penyimpanan, dan cara meminta penghapusan.',
        },
      },
      {
        path: ':pathMatch(.*)*',
        component: () => import('@/pages/NotFoundPage.vue'),
        meta: {
          title: 'Halaman tidak ditemukan',
          description: 'Alamat yang kamu buka tidak ada di situs No Void Minds.',
        },
      },
    ],
  },
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
