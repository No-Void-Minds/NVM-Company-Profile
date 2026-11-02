<script setup lang="ts">
import { nextTick, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import SiteFooter from './SiteFooter.vue'
import SiteHeader from './SiteHeader.vue'

const route = useRoute()
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
  <a href="#main" class="skip-link">Lewati ke konten</a>
  <SiteHeader />
  <main id="main" ref="main" tabindex="-1" class="pt-8">
    <RouterView />
  </main>
  <SiteFooter />
</template>
