<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/i18n'

// Opens outside the site in a new tab and says so to screen readers (FR-135).
// With label, the accessible name is the label, which must start with the visible text.
const props = defineProps<{ href: string; label?: string }>()
const { t } = useI18n()
const ariaLabel = computed(() =>
  props.label ? `${props.label} ${t.value.layout.newTab}` : undefined,
)
</script>

<template>
  <a :href="href" target="_blank" rel="noopener noreferrer" :aria-label="ariaLabel"
    ><slot /><span v-if="!label" class="sr-only"> {{ t.layout.newTab }}</span></a
  >
</template>
