<script setup lang="ts">
import { useI18n } from '@/i18n'

defineProps<{ message: string }>()
defineEmits<{ retry: [] }>()

const { t } = useI18n()
</script>

<template>
  <div role="alert" class="border border-line-strong bg-surface p-3 lg:p-6">
    <p class="spec-label">{{ t.state.failed }}</p>
    <p class="mt-1 max-w-[60ch]">{{ message }}</p>
    <button type="button" class="btn btn-secondary mt-3" @click="$emit('retry')">
      {{ t.state.retry }}
    </button>
  </div>
</template>
