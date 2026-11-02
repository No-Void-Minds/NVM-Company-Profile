<script setup lang="ts">
export type IconName =
  | 'menu'
  | 'close'
  | 'arrow-right'
  | 'arrow-left'
  | 'external'
  | 'chat'
  | 'pause'
  | 'play'
  | 'chevron-down'

const PATHS: Record<IconName, string> = {
  menu: 'M3 7h18M3 12h18M3 17h18',
  close: 'M5 5l14 14M19 5L5 19',
  'arrow-right': 'M4 12h16M14 6l6 6-6 6',
  'arrow-left': 'M20 12H4M10 6l-6 6 6 6',
  external: 'M8 16L19 5M10 5h9v9',
  chat: 'M4 5h16v11H9l-5 4z',
  pause: 'M8 5v14M16 5v14',
  play: 'M7 5l12 7-12 7z',
  'chevron-down': 'M5 9l7 7 7-7',
}

withDefaults(defineProps<{ name: IconName; size?: number }>(), { size: 24 })
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.5"
    aria-hidden="true"
    class="flex-none"
  >
    <path :d="PATHS[name]" />
  </svg>
</template>
