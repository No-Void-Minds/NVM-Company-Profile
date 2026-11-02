<script setup lang="ts">
import IconSvg from '@/components/IconSvg.vue'
import { useTheme } from '@/composables/useTheme'

const { theme, toggle } = useTheme()
</script>

<template>
  <!-- One fixed label with aria-pressed, so the state is announced and not the action -->
  <button
    type="button"
    class="tap flex items-center justify-center active:text-muted"
    aria-label="Tema gelap"
    :aria-pressed="theme === 'dark'"
    @click="toggle"
  >
    <IconSvg :name="theme === 'dark' ? 'moon' : 'sun'" />
  </button>
</template>
