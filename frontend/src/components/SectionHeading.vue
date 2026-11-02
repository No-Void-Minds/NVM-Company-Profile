<script setup lang="ts">
import { ref } from 'vue'
import SpecLabel from './SpecLabel.vue'
import { useInView } from '@/composables/useInView'

withDefaults(
  defineProps<{
    number?: string
    title: string
    lead?: string
    level?: 'h1' | 'h2'
  }>(),
  { number: undefined, lead: undefined, level: 'h2' },
)

const root = ref<HTMLElement | null>(null)
const seen = useInView(root, { once: true })
</script>

<template>
  <header ref="root" :class="{ 'reveal-play': seen }">
    <SpecLabel v-if="number" class="mb-2 block">{{ number }}</SpecLabel>
    <component :is="level" :class="level === 'h1' ? 'text-h1' : 'text-h2'">{{ title }}</component>
    <p v-if="lead" class="mt-3 max-w-[60ch] text-muted">{{ lead }}</p>
  </header>
</template>
