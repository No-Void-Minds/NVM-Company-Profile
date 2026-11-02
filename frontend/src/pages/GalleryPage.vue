<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { api } from '@/api/client'
import AppButton from '@/components/AppButton.vue'
import IconSvg from '@/components/IconSvg.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import { INSTAGRAM_URL, SHOP_URL } from '@/composables/site'
import { useAsync } from '@/composables/useAsync'
import { useFocusTrap } from '@/composables/useFocusTrap'

const SWIPE_DISTANCE = 48

const { data, error, loading, run } = useAsync(() => api.gallery())
const items = computed(() => data.value ?? [])
const categories = computed(() => [...new Set(items.value.map((item) => item.category))])
const category = ref<string | null>(null)
const filtered = computed(() =>
  category.value === null
    ? items.value
    : items.value.filter((item) => item.category === category.value),
)

const lightboxIndex = ref<number | null>(null)
const lightboxOpen = computed(() => lightboxIndex.value !== null)
const current = computed(() =>
  lightboxIndex.value === null ? null : filtered.value[lightboxIndex.value],
)
const lightbox = ref<HTMLElement | null>(null)

function close() {
  lightboxIndex.value = null
}

function step(delta: number) {
  if (lightboxIndex.value === null) return
  const count = filtered.value.length
  lightboxIndex.value = (lightboxIndex.value + delta + count) % count
}

useFocusTrap(lightbox, lightboxOpen, close)

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'ArrowRight') step(1)
  if (event.key === 'ArrowLeft') step(-1)
}

watch(lightboxOpen, (isOpen) => {
  if (isOpen) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

let swipeStartX: number | null = null

function onPointerDown(event: PointerEvent) {
  swipeStartX = event.clientX
}

function onPointerUp(event: PointerEvent) {
  if (swipeStartX === null) return
  const distance = event.clientX - swipeStartX
  swipeStartX = null
  if (Math.abs(distance) >= SWIPE_DISTANCE) step(distance < 0 ? 1 : -1)
}
</script>

<template>
  <div class="wrap section">
    <SectionHeading level="h1" number="Galeri" title="Lookbook, produksi, dan event" />

    <StateLoading v-if="loading" label="Memuat galeri" height="480px" class="mt-6" />
    <StateError v-else-if="error" :message="error" class="mt-6" @retry="run" />
    <StateEmpty
      v-else-if="items.length === 0"
      title="Galeri sedang disiapkan"
      message="Foto baru muncul di sini setelah tim kami mengunggahnya."
      class="mt-6"
    >
      <AppButton v-if="INSTAGRAM_URL" variant="secondary" :href="INSTAGRAM_URL">
        Lihat Instagram NVM
      </AppButton>
      <AppButton v-else variant="secondary" :href="SHOP_URL">Belanja di Shopify</AppButton>
    </StateEmpty>

    <template v-else>
      <div
        v-if="categories.length > 1"
        role="group"
        aria-label="Saring kategori"
        class="mt-6 flex flex-wrap gap-1"
      >
        <button
          type="button"
          class="btn btn-secondary min-h-[44px]"
          :aria-pressed="category === null"
          @click="category = null"
        >
          Semua
        </button>
        <button
          v-for="name in categories"
          :key="name"
          type="button"
          class="btn btn-secondary min-h-[44px]"
          :aria-pressed="category === name"
          @click="category = name"
        >
          {{ name }}
        </button>
      </div>

      <ul class="masonry mt-4">
        <li v-for="(item, index) in filtered" :key="item.id" class="mb-2 break-inside-avoid">
          <button
            type="button"
            class="block w-full cursor-pointer active:opacity-80"
            :aria-label="`Perbesar foto: ${item.alt}`"
            @click="lightboxIndex = index"
          >
            <img
              :src="item.image.src"
              :srcset="item.image.srcset"
              sizes="(min-width: 64rem) 33vw, (min-width: 40rem) 50vw, 100vw"
              :width="item.image.width"
              :height="item.image.height"
              :alt="item.alt"
              loading="lazy"
              decoding="async"
              class="h-auto w-full"
            />
          </button>
          <p v-if="item.caption" class="mt-1 text-muted">{{ item.caption }}</p>
        </li>
      </ul>
    </template>
  </div>

  <div
    v-if="current"
    ref="lightbox"
    role="dialog"
    aria-modal="true"
    :aria-label="`Foto: ${current.alt}`"
    class="lightbox fixed inset-0 z-50 flex flex-col bg-void"
    @pointerdown="onPointerDown"
    @pointerup="onPointerUp"
  >
    <div class="flex items-center justify-between gap-1 p-1">
      <p class="spec-label px-1" aria-live="polite">
        {{ (lightboxIndex ?? 0) + 1 }} / {{ filtered.length }}
      </p>
      <div class="flex gap-1">
        <button type="button" class="tap-icon" aria-label="Foto sebelumnya" @click="step(-1)">
          <IconSvg name="arrow-left" />
        </button>
        <button type="button" class="tap-icon" aria-label="Foto berikutnya" @click="step(1)">
          <IconSvg name="arrow-right" />
        </button>
        <button type="button" class="tap-icon" aria-label="Tutup foto" @click="close">
          <IconSvg name="close" />
        </button>
      </div>
    </div>
    <div class="flex min-h-0 flex-1 items-center justify-center p-1">
      <img
        :key="current.id"
        :src="current.image.src"
        :srcset="current.image.srcset"
        sizes="100vw"
        :alt="current.alt"
        draggable="false"
        class="max-h-full max-w-full object-contain"
      />
    </div>
    <p v-if="current.caption" class="p-2 text-center text-muted">{{ current.caption }}</p>
  </div>
</template>

<style scoped>
.masonry {
  columns: 1;
  column-gap: 16px;
}

/* Horizontal swipes belong to the lightbox instead of the browser */
.lightbox {
  touch-action: pan-y pinch-zoom;
}

.tap-icon {
  display: flex;
  min-width: 48px;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.tap-icon:active {
  background: var(--color-raised);
}

@media (min-width: 40rem) {
  .masonry {
    columns: 2;
  }
}

@media (min-width: 64rem) {
  .masonry {
    columns: 3;
  }
}
</style>
