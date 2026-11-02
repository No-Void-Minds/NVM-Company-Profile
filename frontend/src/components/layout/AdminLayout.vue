<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { errorMessage } from '@/api/client'
import { useSession } from '@/composables/useSession'

const MENU = [
  { to: '/admin/inquiry', label: 'Inquiry' },
  { to: '/admin/galeri', label: 'Galeri' },
  { to: '/admin/testimoni', label: 'Testimoni' },
  { to: '/admin/size-chart', label: 'Size chart' },
  { to: '/admin/katalog', label: 'Tech dan collab' },
  { to: '/admin/audit', label: 'Log audit' },
]

const session = useSession()
const router = useRouter()
const logoutError = ref('')

async function logout() {
  logoutError.value = ''
  try {
    await session.logout()
    await router.push('/admin/login')
  } catch (err) {
    logoutError.value = errorMessage(err)
  }
}
</script>

<template>
  <a href="#admin-main" class="skip-link">Lewati ke konten</a>
  <header class="border-b border-line bg-surface">
    <div class="wrap flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1">
      <p class="spec-label">Admin NVM</p>
      <nav aria-label="Menu admin">
        <ul class="flex flex-wrap gap-x-2">
          <li v-for="item in MENU" :key="item.to">
            <RouterLink :to="item.to" class="text-link" active-class="text-signal">
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
      <div class="flex items-center gap-2">
        <span class="text-muted">{{ session.username.value }}</span>
        <button type="button" class="btn btn-secondary min-h-[44px]" @click="logout">Keluar</button>
      </div>
    </div>
    <p v-if="logoutError" role="alert" class="wrap field-error pb-1">{{ logoutError }}</p>
  </header>
  <main id="admin-main" tabindex="-1" class="wrap py-4">
    <RouterView />
  </main>
</template>
