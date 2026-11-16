<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errorMessage } from '@/api/client'
import IconSvg from '@/components/IconSvg.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useSession } from '@/composables/useSession'

const MENU = [
  { to: '/admin/inquiry', label: 'Inquiry' },
  { to: '/admin/galeri', label: 'Galeri' },
  { to: '/admin/testimoni', label: 'Testimoni' },
  { to: '/admin/size-chart', label: 'Size chart' },
  { to: '/admin/katalog', label: 'Tech dan collab' },
  { to: '/admin/audit', label: 'Log audit' },
  { to: '/admin/pengaturan', label: 'Pengaturan' },
]

const session = useSession()
const router = useRouter()
const route = useRoute()
const logoutError = ref('')

// Below lg the menu folds behind one button, so the header stays one row on a phone
const open = ref(false)
const menuButton = ref<HTMLButtonElement | null>(null)
// The link that was used hides with the menu, so focus moves to the new page instead of body
watch(
  () => route.fullPath,
  () => {
    if (!open.value) return
    open.value = false
    void nextTick(() => document.getElementById('admin-main')?.focus({ preventScroll: true }))
  },
)

function closeMenu() {
  if (!open.value) return
  open.value = false
  void nextTick(() => menuButton.value?.focus())
}

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
  <header class="border-b border-line bg-surface" @keydown.escape="closeMenu">
    <div class="wrap flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1">
      <div class="flex items-center gap-x-2">
        <RouterLink
          to="/admin"
          active-class=""
          exact-active-class=""
          class="spec-label inline-flex min-h-[44px] items-center active:text-fg"
        >
          Admin NVM
        </RouterLink>
        <!-- A plain link, not RouterLink: a full load lets Nginx check the gate for "/" -->
        <a href="/" class="text-link border-l border-line pl-2">Lihat situs</a>
      </div>
      <button
        ref="menuButton"
        type="button"
        class="tap flex items-center justify-center gap-1 lg:hidden"
        aria-controls="admin-menu"
        :aria-expanded="open"
        @click="open = !open"
      >
        <IconSvg :name="open ? 'close' : 'menu'" />
        Menu
      </button>
      <nav
        id="admin-menu"
        aria-label="Menu admin"
        class="w-full lg:block lg:w-auto"
        :class="open ? 'block' : 'hidden'"
      >
        <ul class="flex flex-col lg:flex-row lg:flex-wrap lg:gap-x-2">
          <li v-for="item in MENU" :key="item.to">
            <RouterLink
              :to="item.to"
              class="text-link inline-flex min-h-[44px] items-center"
              active-class="text-signal"
            >
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>
      <div class="w-full items-center gap-2 lg:flex lg:w-auto" :class="open ? 'flex' : 'hidden'">
        <span class="text-muted">{{ session.username.value }}</span>
        <ThemeToggle />
        <button type="button" class="btn btn-secondary min-h-[44px]" @click="logout">Keluar</button>
      </div>
    </div>
    <p v-if="logoutError" role="alert" class="wrap field-error pb-1">{{ logoutError }}</p>
  </header>
  <main id="admin-main" tabindex="-1" class="wrap py-4">
    <RouterView />
  </main>
</template>
