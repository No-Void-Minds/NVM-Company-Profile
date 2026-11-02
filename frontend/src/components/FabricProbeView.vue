<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import SpecLabel from '@/components/SpecLabel.vue'
import { useInView } from '@/composables/useInView'
import { useReducedMotion } from '@/composables/useReducedMotion'
import { FabricProbe, type ProbeVariant } from '@/motion/FabricProbe'

const props = defineProps<{ needs: string[] }>()

const CAPTIONS: Record<ProbeVariant, string> = {
  hot: 'Aliran udara melewati rajutan',
  shape: 'Grid menahan bentuk saat digeser',
  move: 'Grid melar ke empat arah',
  soft: 'Titik mengembang, memberi loft',
  cold: 'Lapisan menutup permukaan',
  layer: 'Cangkang di atas grid',
}

const variant = computed(() =>
  props.needs.includes('hot') ? 'hot' : ((props.needs[0] ?? 'shape') as ProbeVariant),
)

const canvas = ref<HTMLCanvasElement | null>(null)
const playing = ref(false)
const reduced = useReducedMotion()
const inView = useInView(canvas)
let probe: FabricProbe | null = null
let resizeObserver: ResizeObserver | null = null

function stop() {
  playing.value = false
  probe?.stop()
}

function play() {
  if (reduced.value || !probe) return
  playing.value = true
  probe.play()
}

function onVisibility() {
  if (document.hidden) stop()
}

watch(inView, (visible) => {
  if (!visible) stop()
})

onMounted(() => {
  if (!canvas.value) return
  probe = new FabricProbe(canvas.value, variant.value, () => (playing.value = false))
  resizeObserver = new ResizeObserver(() => probe?.resize())
  resizeObserver.observe(canvas.value)
  document.addEventListener('visibilitychange', onVisibility)
})

onBeforeUnmount(() => {
  probe?.stop()
  resizeObserver?.disconnect()
  document.removeEventListener('visibilitychange', onVisibility)
})
</script>

<template>
  <figure class="mt-3">
    <canvas
      ref="canvas"
      aria-hidden="true"
      class="probe-canvas block w-full border border-line"
    ></canvas>
    <figcaption class="mt-1 flex flex-wrap items-center justify-between gap-1">
      <span>
        <SpecLabel class="block">Ilustrasi, bukan hasil uji</SpecLabel>
        <span class="text-muted">{{ CAPTIONS[variant] }}</span>
      </span>
      <button
        v-if="!reduced"
        type="button"
        class="btn btn-secondary min-h-[44px]"
        :disabled="playing"
        @click="play"
      >
        Peragakan sifat kain
      </button>
    </figcaption>
  </figure>
</template>

<style scoped>
.probe-canvas {
  aspect-ratio: 2 / 1;
  max-height: 200px;
}
</style>
