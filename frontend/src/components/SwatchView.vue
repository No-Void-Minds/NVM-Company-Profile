<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Swatch, type SwatchSource } from '@/motion/Swatch'

// weave plays the Re-weave once on mount, which is how a tech change shows on Teknologi.
const props = withDefaults(defineProps<{ tech: SwatchSource; weave?: boolean }>(), {
  weave: false,
})

const canvas = ref<HTMLCanvasElement | null>(null)
let swatch: Swatch | null = null
let resizeObserver: ResizeObserver | null = null
let host: HTMLElement | null = null

const play = () => swatch?.play()

onMounted(() => {
  if (!canvas.value) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  swatch = new Swatch(canvas.value, props.tech, reduced)
  swatch.resize()
  resizeObserver = new ResizeObserver(() => swatch?.resize())
  resizeObserver.observe(canvas.value)
  // The link or row around the swatch is what people hover or tab to.
  host = canvas.value.closest<HTMLElement>('[data-swatch-host]') ?? canvas.value
  host.addEventListener('pointerenter', play)
  host.addEventListener('focusin', play)
  if (props.weave) swatch.weave()
})

onBeforeUnmount(() => {
  host?.removeEventListener('pointerenter', play)
  host?.removeEventListener('focusin', play)
  resizeObserver?.disconnect()
  swatch?.destroy()
})
</script>

<template>
  <canvas ref="canvas" aria-hidden="true" class="block h-full w-full"></canvas>
</template>
