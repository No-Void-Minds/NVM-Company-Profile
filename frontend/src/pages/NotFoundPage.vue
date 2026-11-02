<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import { useI18n } from '@/i18n'

const { t, to } = useI18n()
</script>

<template>
  <div class="wrap section">
    <SectionHeading level="h1" number="404" :title="t.notFound.title" :lead="t.notFound.lead" />
    <div class="mt-4 flex flex-wrap gap-2">
      <AppButton :to="to('/')">{{ t.notFound.home }}</AppButton>
      <AppButton :to="to('/teknologi')" variant="secondary">{{ t.cta.seeSystems }}</AppButton>
    </div>
  </div>
</template>
