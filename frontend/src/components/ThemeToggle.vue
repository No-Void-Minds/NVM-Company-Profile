<script setup lang="ts">
import IconSvg from '@/components/IconSvg.vue'
import { useTheme } from '@/composables/useTheme'
import { useI18n } from '@/i18n'

const { theme, toggle } = useTheme()
const { t } = useI18n()
</script>

<template>
  <!-- One fixed label with aria-pressed, so the state is announced and not the action -->
  <button
    type="button"
    class="tap flex items-center justify-center active:text-muted"
    :aria-label="t.layout.darkTheme"
    :aria-pressed="theme === 'dark'"
    @click="toggle"
  >
    <IconSvg :name="theme === 'dark' ? 'moon' : 'sun'" />
  </button>
</template>
