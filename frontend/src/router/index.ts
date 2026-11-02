import {
  createRouter,
  type RouteRecordRaw,
  type RouterHistory,
  type RouterScrollBehavior,
} from 'vue-router'
import PublicLayout from '@/components/layout/PublicLayout.vue'
import type { HeadMeta } from '@/composables/useHead'
import HomePage from '@/pages/HomePage.vue'

declare module 'vue-router' {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface RouteMeta extends Partial<HeadMeta> {}
}

const pending = () => import('@/pages/PendingPage.vue')

const routes: RouteRecordRaw[] = [
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
        component: pending,
        meta: {
          title: 'Produk',
          description:
            'Beda lini Core dan Graphic. Core dipilih dari tech dan fit, Graphic dari daftar collab karakter berlisensi.',
        },
      },
      {
        path: 'b2b',
        component: pending,
        meta: {
          title: 'B2B',
          description:
            'Dua jalur kerja sama dengan NVM: Wholesale untuk toko dan reseller, Collaboration untuk brand, komunitas, dan tim. Kirim inquiry lewat formulir.',
        },
      },
      {
        path: 'galeri',
        component: pending,
        meta: {
          title: 'Galeri',
          description: 'Foto lookbook, produksi, dan event No Void Minds.',
        },
      },
      {
        path: 'testimoni',
        component: pending,
        meta: {
          title: 'Testimoni',
          description:
            'Tangkapan layar ulasan pembeli NVM dari Shopee dan TikTok Shop, lengkap dengan transkrip teks.',
        },
      },
      {
        path: 'size',
        component: pending,
        meta: {
          title: 'Size',
          description:
            'Cari ukuran NVM dari tinggi badan atau dari kaos favoritmu, memakai size chart resmi per tech dan fit.',
        },
      },
      {
        path: 'kontak',
        component: pending,
        meta: {
          title: 'Kontak',
          description:
            'Hubungi tim NVM lewat WhatsApp untuk tanya tech, wholesale, atau collaboration.',
        },
      },
      {
        path: 'privasi',
        component: pending,
        meta: {
          title: 'Kebijakan Privasi',
          description:
            'Data apa yang NVM simpan dari formulir B2B, tujuannya, lama penyimpanan, dan cara meminta penghapusan.',
        },
      },
      {
        path: ':pathMatch(.*)*',
        component: pending,
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
  return createRouter({ history, routes, scrollBehavior })
}
