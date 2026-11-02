<script setup lang="ts">
import { computed } from 'vue'
import type { RouteLocationRaw } from 'vue-router'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'link'
    to?: RouteLocationRaw
    href?: string
    type?: 'button' | 'submit'
    disabled?: boolean
  }>(),
  { variant: 'primary', to: undefined, href: undefined, type: 'button' },
)

const classes = computed(() => ['btn', `btn-${props.variant}`])
</script>

<template>
  <RouterLink v-if="to" :to="to" :class="classes"><slot /></RouterLink>
  <a v-else-if="href" :href="href" :class="classes" target="_blank" rel="noopener"><slot /></a>
  <button v-else :type="type" :disabled="disabled" :class="classes"><slot /></button>
</template>
