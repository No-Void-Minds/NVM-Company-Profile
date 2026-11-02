<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import KnitDivider from '@/components/KnitDivider.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import { pad2 } from '@/composables/site'
import { useI18n } from '@/i18n'

const { lang, t, to } = useI18n()
</script>

<template>
  <div class="wrap section">
    <SectionHeading level="h1" number="Brand" title="No Void Minds" />
    <p class="mt-4 max-w-[32ch] text-h3">{{ t.brand.statement }}</p>
  </div>

  <KnitDivider />

  <section class="wrap section grid gap-4 lg:grid-cols-[2fr_3fr] lg:gap-12">
    <!-- Brand slogan, kept in English on both sites -->
    <SectionHeading title="Engineered to perfection." :lang="lang === 'id' ? 'en' : undefined" />
    <p class="max-w-[56ch] text-muted">{{ t.brand.engineeredBody }}</p>
  </section>

  <KnitDivider />

  <section class="wrap section">
    <SectionHeading :title="t.brand.stagesTitle" />
    <ol class="mt-6">
      <li
        v-for="(stage, index) in t.brand.stages"
        :key="index"
        class="grid gap-2 border-t border-line py-4 lg:grid-cols-[1fr_2fr_3fr] lg:gap-6"
      >
        <p class="spec-label">{{ pad2(index + 1) }} {{ stage.label }}</p>
        <h3 class="text-h3">{{ stage.title }}</h3>
        <p class="max-w-[56ch] text-muted">{{ stage.body }}</p>
      </li>
    </ol>
  </section>

  <KnitDivider />

  <section class="wrap section flex flex-wrap items-end justify-between gap-4">
    <div>
      <h2 class="spec-label">{{ t.brand.timeline }}</h2>
      <p class="mt-2 text-h2">2021, Bandung</p>
    </div>
    <AppButton :to="to('/teknologi')" variant="secondary">{{ t.cta.seeSystems }}</AppButton>
  </section>
</template>
