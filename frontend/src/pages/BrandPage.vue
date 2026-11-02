<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import KnitDivider from '@/components/KnitDivider.vue'
import SectionHeading from '@/components/SectionHeading.vue'

const STAGES = [
  {
    number: '01',
    label: 'The annoyance',
    title: 'Start with what bugs you',
    body: 'A tee that clings by noon. A collar that gives up by the third wash. Every system starts with one small, specific annoyance.',
  },
  {
    number: '02',
    label: 'The fabric',
    title: 'Fix it in the material',
    body: 'Not with a print or a trim. We work the fabric itself: the knit, the weight, the stretch, the finish.',
  },
  {
    number: '03',
    label: 'The garment',
    title: 'Then, and only then, cut',
    body: 'Regular, boxy, oversized, fitted. The cut follows what the fabric can do.',
  },
]
</script>

<template>
  <div class="wrap section">
    <SectionHeading level="h1" number="Brand" title="No Void Minds" />
    <p class="mt-4 max-w-[32ch] text-h3" lang="en">
      We build technical everyday wear from the material out. Engineering proprietary fabric systems
      first, then designing each garment around what the fabric can do. Made for those who refuse to
      blend in.
    </p>
  </div>

  <KnitDivider />

  <section class="wrap section grid gap-4 lg:grid-cols-[2fr_3fr] lg:gap-12">
    <SectionHeading title="Engineered to perfection." />
    <p class="max-w-[56ch] text-muted" lang="en">
      Performance first, then form. Every seam, panel, and material choice is engineered until it is
      right. Nothing decorative, nothing wasted.
    </p>
  </section>

  <KnitDivider />

  <section class="wrap section">
    <SectionHeading title="Cara sebuah system dibuat" />
    <ol class="mt-6">
      <li
        v-for="stage in STAGES"
        :key="stage.number"
        class="grid gap-2 border-t border-line py-4 lg:grid-cols-[1fr_2fr_3fr] lg:gap-6"
      >
        <p class="spec-label">{{ stage.number }} {{ stage.label }}</p>
        <h3 class="text-h3" lang="en">{{ stage.title }}</h3>
        <p class="max-w-[56ch] text-muted" lang="en">{{ stage.body }}</p>
      </li>
    </ol>
  </section>

  <KnitDivider />

  <section class="wrap section flex flex-wrap items-end justify-between gap-4">
    <div>
      <h2 class="spec-label">Garis waktu</h2>
      <p class="mt-2 text-h2">2021, Bandung</p>
    </div>
    <AppButton to="/teknologi" variant="secondary">Lihat 11 material system</AppButton>
  </section>
</template>
