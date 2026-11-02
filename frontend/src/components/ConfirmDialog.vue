<script setup lang="ts">
import { ref, toRef } from 'vue'
import { useFocusTrap } from '@/composables/useFocusTrap'

const props = defineProps<{
  open: boolean
  title: string
  message: string
  confirmLabel: string
}>()
const emit = defineEmits<{ confirm: []; cancel: [] }>()

const panel = ref<HTMLElement | null>(null)
useFocusTrap(panel, toRef(props, 'open'), () => emit('cancel'))
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-void/80 p-2"
    @click.self="emit('cancel')"
  >
    <div
      ref="panel"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
      aria-describedby="confirm-message"
      class="w-full max-w-[480px] border border-line-strong bg-surface p-3"
    >
      <h2 id="confirm-title" class="text-h3">{{ title }}</h2>
      <p id="confirm-message" class="mt-2 text-muted">{{ message }}</p>
      <div class="mt-3 flex flex-wrap justify-end gap-2">
        <button type="button" class="btn btn-secondary" @click="emit('cancel')">Batal</button>
        <button type="button" class="btn btn-primary" @click="emit('confirm')">
          {{ confirmLabel }}
        </button>
      </div>
    </div>
  </div>
</template>
