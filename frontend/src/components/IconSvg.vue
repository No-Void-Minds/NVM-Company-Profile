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
  | 'sun'
  | 'moon'

const PATHS: Record<IconName, string> = {
  sun: 'M12 8a4 4 0 1 0 0 8a4 4 0 1 0 0-8M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1',
  moon: 'M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z',
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
