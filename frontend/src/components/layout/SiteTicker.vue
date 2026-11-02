<script setup lang="ts">
import { ref } from 'vue'
import IconSvg from '@/components/IconSvg.vue'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { useI18n } from '@/i18n'

const ITEMS = [
  'CURFLEX SMOOTH FLEX TECHNOLOGY',
  'AEZY AIR FEEL TECHNOLOGY',
  'NVM LAB',
  'FORMLOCK CONTOUR CONDITIONING TECHNOLOGY',
]

const { t } = useI18n()
const paused = ref(false)
const reduced = useReducedMotion()
</script>

<template>
  <div class="ticker flex items-center border-b border-line" :class="{ 'ticker-paused': paused }">
    <div class="min-w-0 flex-1 overflow-hidden">
      <div class="ticker-track" lang="en">
        <ul class="ticker-group">
          <li v-for="item in ITEMS" :key="item" class="spec-label">{{ item }}</li>
        </ul>
        <!-- Second copy closes the loop, screen readers only need the first -->
        <ul class="ticker-group" aria-hidden="true">
          <li v-for="item in ITEMS" :key="item" class="spec-label">{{ item }}</li>
        </ul>
      </div>
    </div>
    <button
      v-if="!reduced"
      type="button"
      class="tap flex flex-none items-center justify-center bg-bg active:bg-raised"
      :aria-label="paused ? t.layout.playTicker : t.layout.pauseTicker"
      @click="paused = !paused"
    >
      <IconSvg :name="paused ? 'play' : 'pause'" :size="16" />
    </button>
  </div>
</template>

<style scoped>
.ticker-track {
  display: flex;
  width: max-content;
  animation: ticker-slide 48s linear infinite;
}

.ticker-group {
  display: flex;
  flex: none;
  gap: 48px;
  padding-right: 48px;
  white-space: nowrap;
}

.ticker-paused .ticker-track,
.ticker:hover .ticker-track,
.ticker:focus-within .ticker-track {
  animation-play-state: paused;
}

@keyframes ticker-slide {
  to {
    transform: translateX(-50%);
  }
}

@media (prefers-reduced-motion: reduce) {
  .ticker-track {
    animation: none;
  }
}
</style>
