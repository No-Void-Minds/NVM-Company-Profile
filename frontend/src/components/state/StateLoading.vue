<script setup lang="ts">
import { useI18n } from '@/i18n'

withDefaults(defineProps<{ label?: string; height?: string }>(), {
  label: undefined,
  height: '240px',
})

const { t } = useI18n()
</script>

<template>
  <div role="status" class="knit-bg w-full" :style="{ minHeight: height }">
    <span class="sr-only">{{ label ?? t.state.loading }}</span>
  </div>
</template>
