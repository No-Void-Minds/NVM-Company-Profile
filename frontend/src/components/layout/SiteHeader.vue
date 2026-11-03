<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import IconSvg from '@/components/IconSvg.vue'
import LangToggle from '@/components/LangToggle.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { useFocusTrap } from '@/composables/useFocusTrap'
import { useI18n } from '@/i18n'

const { t, to } = useI18n()

const MENU = computed(() =>
  (
    [
      ['/brand', 'brand'],
      ['/teknologi', 'tech'],
      ['/produk', 'product'],
      ['/b2b', 'b2b'],
      ['/galeri', 'gallery'],
      ['/testimoni', 'testimonial'],
      ['/size', 'size'],
      ['/kontak', 'contact'],
    ] as const
  ).map(([path, key]) => ({ to: to(path), label: t.value.nav[key] })),
)

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
  <header class="fixed inset-x-0 top-0 z-40 border-b border-line bg-bg">
    <div class="wrap flex h-8 items-center justify-between gap-2">
      <RouterLink :to="to('/')" class="tap flex items-center" :aria-label="t.layout.homeLink">
        <BrandLogo />
      </RouterLink>

      <nav :aria-label="t.layout.mainMenu" class="hidden lg:block">
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

      <div class="flex items-center">
        <LangToggle />
        <ThemeToggle />
        <button
          type="button"
          class="tap flex items-center justify-center lg:hidden"
          :aria-label="t.layout.openMenu"
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
        :aria-label="t.layout.mainMenu"
        class="ml-auto flex h-full w-full max-w-[480px] flex-col overflow-y-auto border-l border-line bg-surface"
      >
        <div class="flex h-8 flex-none items-center justify-end px-2">
          <button
            type="button"
            class="tap flex items-center justify-center"
            :aria-label="t.layout.closeMenu"
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
  color: var(--muted);
  transition: color 160ms ease;
}

.nav-link:active,
.nav-link-active {
  color: var(--fg);
}

.nav-link-active {
  text-decoration: underline;
  text-decoration-color: var(--signal);
  text-underline-offset: 8px;
}

@media (hover: hover) {
  .nav-link:hover {
    color: var(--fg);
  }
}
</style>
