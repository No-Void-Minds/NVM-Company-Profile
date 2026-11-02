<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import IconSvg from '@/components/IconSvg.vue'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { SHOP_URL } from '@/composables/site'

const MENU = [
  { to: '/brand', label: 'Brand' },
  { to: '/teknologi', label: 'Teknologi' },
  { to: '/produk', label: 'Produk' },
  { to: '/b2b', label: 'B2B' },
  { to: '/galeri', label: 'Galeri' },
  { to: '/testimoni', label: 'Testimoni' },
  { to: '/size', label: 'Size' },
  { to: '/kontak', label: 'Kontak' },
]

const open = ref(false)
const panel = ref<HTMLElement | null>(null)
const route = useRoute()

useFocusTrap(panel, open, () => (open.value = false))
watch(
  () => route.fullPath,
  () => (open.value = false),
)
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-40 border-b border-line bg-void">
    <div class="wrap flex h-8 items-center justify-between gap-2">
      <RouterLink to="/" class="tap flex items-center" aria-label="No Void Minds, ke Beranda">
        <img src="/brand/nvm-logo.png" alt="" width="4084" height="1512" class="h-5 w-auto" />
      </RouterLink>

      <nav aria-label="Menu utama" class="hidden lg:block">
        <ul class="flex items-center gap-2 xl:gap-3">
          <li v-for="item in MENU" :key="item.to">
            <RouterLink
              :to="item.to"
              class="nav-link"
              active-class="nav-link-active"
              :aria-current="route.path === item.to ? 'page' : undefined"
            >
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
      </nav>

      <div class="flex items-center gap-1">
        <a
          :href="SHOP_URL"
          target="_blank"
          rel="noopener"
          class="btn btn-secondary hidden min-h-[44px] whitespace-nowrap sm:inline-flex"
        >
          Belanja di Shopify
        </a>
        <button
          type="button"
          class="tap flex items-center justify-center lg:hidden"
          aria-label="Buka menu"
          aria-haspopup="dialog"
          :aria-expanded="open"
          @click="open = true"
        >
          <IconSvg name="menu" />
        </button>
      </div>
    </div>

    <div v-if="open" class="fixed inset-0 z-50 lg:hidden" @click.self="open = false">
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu utama"
        class="ml-auto flex h-full w-full max-w-[480px] flex-col overflow-y-auto border-l border-line bg-surface"
      >
        <div class="flex h-8 flex-none items-center justify-end px-2">
          <button
            type="button"
            class="tap flex items-center justify-center"
            aria-label="Tutup menu"
            @click="open = false"
          >
            <IconSvg name="close" />
          </button>
        </div>
        <ul class="flex-1 px-2">
          <li v-for="item in MENU" :key="item.to" class="border-b border-line">
            <RouterLink
              :to="item.to"
              class="flex min-h-[56px] items-center text-h3 active:text-muted"
              :aria-current="route.path === item.to ? 'page' : undefined"
            >
              {{ item.label }}
            </RouterLink>
          </li>
        </ul>
        <div class="p-2">
          <a :href="SHOP_URL" target="_blank" rel="noopener" class="btn btn-primary w-full">
            Belanja di Shopify
          </a>
        </div>
      </div>
    </div>
  </header>
</template>

<style scoped>
.nav-link {
  display: inline-flex;
  align-items: center;
  min-height: 44px;
  padding-inline: 8px;
  color: var(--color-muted);
  transition: color 160ms ease;
}

.nav-link:active,
.nav-link-active {
  color: var(--color-bone);
}

.nav-link-active {
  text-decoration: underline;
  text-decoration-color: var(--color-signal);
  text-underline-offset: 8px;
}

@media (hover: hover) {
  .nav-link:hover {
    color: var(--color-bone);
  }
}
</style>
