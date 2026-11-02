<script setup lang="ts">
defineProps<{ message: string }>()
defineEmits<{ retry: [] }>()
</script>

<template>
  <div role="alert" class="border border-line-strong bg-surface p-3 lg:p-6">
    <p class="spec-label">Data gagal dimuat</p>
    <p class="mt-1 max-w-[60ch]">{{ message }}</p>
    <button type="button" class="btn btn-secondary mt-3" @click="$emit('retry')">Coba lagi</button>
  </div>
</template>
