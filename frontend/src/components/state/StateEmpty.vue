<script setup lang="ts">
defineProps<{ title: string; message?: string }>()
</script>

<template>
  <div class="border border-line bg-surface p-3 lg:p-6">
    <p class="text-h3">{{ title }}</p>
    <p v-if="message" class="mt-2 max-w-[60ch] text-muted">{{ message }}</p>
    <div v-if="$slots.default" class="mt-3 flex flex-wrap gap-2">
      <slot />
    </div>
  </div>
</template>
