<script setup lang="ts">
import { computed } from 'vue'
import type { Tech } from '@/api/types'
import AppButton from '@/components/AppButton.vue'
import FabricProbeView from '@/components/FabricProbeView.vue'
import SpecLabel from '@/components/SpecLabel.vue'
import { collectionUrl, NEED_FILTERS, pad2, techName } from '@/composables/site'

const props = defineProps<{ tech: Tech; number: number }>()

const needLabels = computed(() =>
  props.tech.needs.map((need) => NEED_FILTERS.find((f) => f.key === need)?.label ?? need),
)

const firstFit = computed(() => props.tech.fits[0] ?? '')
const sizeLink = computed(() => ({
  path: '/size',
  query: { tech: props.tech.key, ...(firstFit.value ? { fit: firstFit.value } : {}) },
}))
</script>

<template>
  <article>
    <div class="flex items-start justify-between gap-2">
      <p class="index-numeral hidden lg:block" aria-hidden="true">{{ pad2(number) }}</p>
      <SpecLabel :class="{ 'text-signal': tech.on_rack }">
        {{ tech.on_rack ? 'On the rack' : 'Belum tersedia' }}
      </SpecLabel>
    </div>

    <h2 class="mt-2 text-h2">{{ techName(tech.name) }}</h2>
    <p class="mt-1 text-h3" lang="en">{{ tech.tagline }}</p>

    <dl class="mt-3 grid grid-cols-2 gap-2 border-y border-line py-2">
      <div>
        <dt class="spec-label">Keluarga</dt>
        <dd>{{ tech.family }}</dd>
      </div>
      <div>
        <dt class="spec-label">Generasi</dt>
        <dd>{{ tech.generation }}</dd>
      </div>
      <div>
        <dt class="spec-label">Untuk</dt>
        <dd lang="en">{{ needLabels.join(', ') }}</dd>
      </div>
      <div>
        <dt class="spec-label">Sifat</dt>
        <dd lang="en">{{ tech.sub }}</dd>
      </div>
    </dl>

    <p class="mt-3 max-w-[60ch] text-muted" lang="en">{{ tech.description }}</p>

    <ul class="mt-3 flex flex-wrap gap-1" aria-label="Fitur">
      <li v-for="chip in tech.chips" :key="chip" class="border border-line px-1 py-0.5" lang="en">
        {{ chip }}
      </li>
    </ul>

    <div class="mt-3">
      <p class="spec-label">Fit tersedia</p>
      <p class="mt-1">{{ tech.fits.length > 0 ? tech.fits.join(', ') : 'Tanpa pilihan fit' }}</p>
    </div>

    <FabricProbeView :needs="tech.needs" />

    <div class="mt-4 flex flex-wrap gap-2">
      <AppButton v-if="tech.on_rack" :href="collectionUrl(tech.key)">Lihat di Shopify</AppButton>
      <AppButton :to="sizeLink" variant="secondary">
        Cari ukuran {{ tech.name }} {{ firstFit }}
      </AppButton>
    </div>
  </article>
</template>

<style scoped>
.index-numeral {
  font-size: var(--text-h1);
  line-height: 1;
  color: transparent;
  -webkit-text-stroke: 1px var(--color-bone);
}
</style>
