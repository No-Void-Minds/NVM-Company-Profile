<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { api } from '@/api/client'
import AppButton from '@/components/AppButton.vue'
import KnitDivider from '@/components/KnitDivider.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import { pad2, SHOPEE_URL } from '@/composables/site'
import { useAsync } from '@/composables/useAsync'
import { formatDate, useI18n } from '@/i18n'
import { KnitField } from '@/motion/KnitField'

const { lang, t, to } = useI18n()
const hero = ref<HTMLElement | null>(null)
const canvas = ref<HTMLCanvasElement | null>(null)
let field: KnitField | null = null

onMounted(() => {
  if (!hero.value || !canvas.value) return
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  field = new KnitField(canvas.value, hero.value, reduced)
  field.start()
})
onBeforeUnmount(() => field?.destroy())

const stats = useAsync(() => api.labStats())
// These two only decide whether a section exists, so a failure just hides it (FR-13).
const gallery = useAsync(() => api.gallery(lang.value).catch(() => []))
const testimonials = useAsync(() => api.testimonials().catch(() => []))

const galleryPreview = computed(() => (gallery.data.value ?? []).slice(0, 4))
const testimonialPreview = computed(() => (testimonials.data.value ?? []).slice(0, 3))

const SOURCE_LABEL = { shopee: 'Shopee', tiktok_shop: 'TikTok Shop' }
</script>

<template>
  <section ref="hero" class="hero measure-grid relative overflow-hidden border-b border-line">
    <canvas ref="canvas" aria-hidden="true" class="absolute inset-0 h-full w-full"></canvas>
    <div class="wrap pointer-events-none relative py-8 lg:py-12">
      <p class="spec-label">Engineered to perfection</p>
      <h1 class="mt-2 text-h1">Fabric first.</h1>
      <p class="mt-3 max-w-[44ch] bg-bg text-h3">{{ t.home.lead }}</p>
      <div class="pointer-events-auto mt-4 flex flex-wrap gap-2">
        <AppButton :to="to('/teknologi')">{{ t.cta.seeSystems }}</AppButton>
        <AppButton variant="secondary" :href="SHOPEE_URL">{{ t.layout.shop }}</AppButton>
      </div>
    </div>
  </section>

  <section aria-labelledby="lab-index-title" class="wrap section">
    <h2 id="lab-index-title" class="spec-label">{{ t.home.labIndex }}</h2>
    <StateLoading
      v-if="stats.loading.value"
      :label="t.home.labLoading"
      height="120px"
      class="mt-3"
    />
    <StateError
      v-else-if="stats.error.value"
      :message="stats.error.value"
      class="mt-3"
      @retry="stats.run"
    />
    <StateEmpty v-else-if="stats.data.value?.systems === 0" :title="t.home.labEmpty" class="mt-3" />
    <dl v-else-if="stats.data.value" class="mt-3 flex flex-wrap gap-x-8 gap-y-4">
      <div>
        <dd class="text-h1 leading-none">{{ pad2(stats.data.value.systems) }}</dd>
        <dt class="spec-label mt-1">{{ t.home.systems }}</dt>
      </div>
      <div v-if="stats.data.value.on_rack > 0">
        <dd class="text-h1 leading-none">{{ pad2(stats.data.value.on_rack) }}</dd>
        <dt class="spec-label mt-1 text-signal">{{ t.home.onRack }}</dt>
      </div>
      <div>
        <dd class="text-h1 leading-none">{{ stats.data.value.est_year }}</dd>
        <dt class="spec-label mt-1">{{ t.home.founded }}</dt>
      </div>
    </dl>
  </section>

  <KnitDivider />

  <section class="wrap section grid gap-6 lg:grid-cols-[3fr_2fr] lg:gap-12">
    <div>
      <SectionHeading number="01" :title="t.home.lineTitle" />
      <p class="mt-3 max-w-[56ch] text-muted">{{ t.home.lineBody }}</p>
      <AppButton :to="to('/produk')" variant="secondary" class="mt-4">
        {{ t.home.lineCta }}
      </AppButton>
    </div>
    <div class="border-t border-line pt-4 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-6">
      <SectionHeading number="02" :title="t.home.b2bTitle" />
      <p class="mt-3 text-muted">{{ t.home.b2bBody }}</p>
      <AppButton :to="to('/b2b')" variant="secondary" class="mt-4">{{ t.home.b2bCta }}</AppButton>
    </div>
  </section>

  <template v-if="testimonialPreview.length > 0">
    <KnitDivider />
    <section class="wrap section">
      <SectionHeading number="03" :title="t.home.buyersTitle" />
      <ul class="mt-4 grid gap-4 lg:grid-cols-3">
        <li v-for="item in testimonialPreview" :key="item.id" class="border-t border-line pt-2">
          <p class="spec-label">
            {{ SOURCE_LABEL[item.source] }}, {{ formatDate(item.review_date, lang) }}
          </p>
          <p class="mt-1 line-clamp-5" :lang="item.lang">{{ item.transcript }}</p>
        </li>
      </ul>
      <AppButton :to="to('/testimoni')" variant="link" class="mt-3">
        {{ t.home.buyersCta }}
      </AppButton>
    </section>
  </template>

  <template v-if="galleryPreview.length > 0">
    <KnitDivider />
    <section class="wrap section">
      <SectionHeading number="04" :title="t.home.galleryTitle" />
      <ul class="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <li v-for="item in galleryPreview" :key="item.id">
          <img
            :src="item.image.src"
            :srcset="item.image.srcset"
            sizes="(min-width: 64rem) 25vw, 50vw"
            :width="item.image.width"
            :height="item.image.height"
            :alt="item.alt"
            loading="lazy"
            decoding="async"
            class="h-auto w-full"
          />
        </li>
      </ul>
      <AppButton :to="to('/galeri')" variant="link" class="mt-3">
        {{ t.home.galleryCta }}
      </AppButton>
    </section>
  </template>
</template>

<style scoped>
/* Vertical swipes must still scroll the page on touch screens */
.hero {
  touch-action: pan-y;
  min-height: min(80svh, 720px);
  display: flex;
  align-items: flex-end;
}
</style>
