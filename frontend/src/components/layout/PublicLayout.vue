<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '@/i18n'
import SiteFooter from './SiteFooter.vue'
import SiteHeader from './SiteHeader.vue'
import SiteTicker from './SiteTicker.vue'

const route = useRoute()
const { lang, t } = useI18n()
const main = ref<HTMLElement | null>(null)

// A client side route change gives screen readers no signal unless focus moves.
watch(
  () => route.path,
  async () => {
    await nextTick()
    main.value?.focus({ preventScroll: true })
  },
)
</script>

<template>
  <a href="#main" class="skip-link">{{ t.layout.skip }}</a>
  <SiteHeader />
  <main id="main" ref="main" tabindex="-1" class="pt-8">
    <SiteTicker />
    <!-- /teknologi and /en/teknologi share a component, the key remounts it so data reloads -->
    <RouterView v-slot="{ Component }">
      <component :is="Component" :key="lang" />
    </RouterView>
  </main>
  <SiteFooter />
</template>
