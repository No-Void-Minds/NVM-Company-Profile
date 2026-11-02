<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { localePath, useI18n, type Lang } from '@/i18n'

const route = useRoute()
const { lang, t } = useI18n()

const target = computed<Lang>(() => (lang.value === 'en' ? 'id' : 'en'))
// Same page, query, and hash in the other language (FR-111)
const link = computed(() => ({
  path: localePath(route.path, target.value),
  query: route.query,
  hash: route.hash,
}))
</script>

<template>
  <RouterLink
    :to="link"
    class="tap flex items-center justify-center gap-0.5 font-mono text-[0.8125rem] active:text-muted"
    :hreflang="target"
    :lang="target"
    :aria-label="t.layout.switchLang"
  >
    <span :class="lang === 'id' ? 'text-fg' : 'text-muted'">ID</span>
    <span class="text-muted" aria-hidden="true">/</span>
    <span :class="lang === 'en' ? 'text-fg' : 'text-muted'">EN</span>
  </RouterLink>
</template>
