<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from '@/i18n'

const props = defineProps<{
  id: string
  label: string
  error?: string
  hint?: string
  optional?: boolean
}>()

const { t } = useI18n()

const describedby = computed(
  () =>
    [props.hint ? `${props.id}-hint` : '', props.error ? `${props.id}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined,
)
</script>

<template>
  <div>
    <label :for="id" class="field-label">
      {{ label }}
      <span v-if="optional" class="text-muted">{{ t.state.optional }}</span>
    </label>
    <slot :describedby="describedby" :invalid="error ? true : undefined" />
    <p v-if="hint" :id="`${id}-hint`" class="field-hint">{{ hint }}</p>
    <p v-if="error" :id="`${id}-error`" class="field-error">{{ error }}</p>
  </div>
</template>
