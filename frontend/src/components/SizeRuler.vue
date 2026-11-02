<script setup lang="ts">
import { computed } from 'vue'

// Ruler (SRS 14.5): a cm scale whose needle travels to the value typed in. The value is
// already in the input next to it, so the ruler itself is hidden from screen readers.
const props = defineProps<{ value: number | null; min: number; max: number }>()

const span = computed(() => props.max - props.min)
const ticks = computed(() =>
  Array.from({ length: span.value + 1 }, (_, i) => {
    const cm = props.min + i
    return {
      cm,
      left: `${(i / span.value) * 100}%`,
      size: cm % 10 === 0 ? 'major' : cm % 5 === 0 ? 'mid' : 'minor',
    }
  }),
)

const needle = computed(() => {
  if (props.value === null || !Number.isFinite(props.value)) return null
  const clamped = Math.min(props.max, Math.max(props.min, props.value))
  return `translateX(${((clamped - props.min) / span.value) * 100}%)`
})
</script>

<template>
  <div class="ruler measure-grid" aria-hidden="true">
    <div class="ruler-scale">
      <span
        v-for="tick in ticks"
        :key="tick.cm"
        class="ruler-tick"
        :class="`ruler-tick-${tick.size}`"
        :style="{ left: tick.left }"
      >
        <span v-if="tick.size === 'major'" class="ruler-label">{{ tick.cm }}</span>
      </span>
      <div v-if="needle" class="ruler-needle-track" :style="{ transform: needle }">
        <span class="ruler-needle"></span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ruler {
  border: 1px solid var(--line);
  padding: 8px 16px 32px;
}

.ruler-scale {
  position: relative;
  height: 32px;
  border-top: 1px solid var(--line-strong);
}

.ruler-tick {
  position: absolute;
  top: 0;
  width: 1px;
  background: var(--line-strong);
}

.ruler-tick-minor {
  height: 8px;
}

.ruler-tick-mid {
  height: 16px;
}

.ruler-tick-major {
  height: 24px;
  background: var(--fg);
}

.ruler-label {
  position: absolute;
  top: 24px;
  left: 0;
  transform: translateX(-50%);
  font-family: var(--font-mono);
  font-size: var(--text-label);
  color: var(--muted);
}

/* Full width, so a translateX percentage is a share of the scale */
.ruler-needle-track {
  position: absolute;
  inset: 0;
  transition: transform 400ms ease;
}

.ruler-needle {
  position: absolute;
  top: -8px;
  left: -1px;
  width: 2px;
  height: 40px;
  background: var(--signal);
}
</style>
