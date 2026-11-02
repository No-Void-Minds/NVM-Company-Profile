<script setup lang="ts">
withDefaults(defineProps<{ label?: string; height?: string }>(), {
  label: 'Memuat data',
  height: '240px',
})
</script>

<template>
  <div role="status" class="knit-bg w-full" :style="{ minHeight: height }">
    <span class="sr-only">{{ label }}</span>
  </div>
</template>
