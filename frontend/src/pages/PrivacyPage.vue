<script setup lang="ts">
import AppButton from '@/components/AppButton.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/composables/site'
import { useI18n } from '@/i18n'

const { t } = useI18n()
</script>

<template>
  <div class="wrap section">
    <SectionHeading
      level="h1"
      :number="t.privacy.number"
      :title="t.privacy.title"
      :lead="t.privacy.lead"
    />

    <div class="mt-6 grid max-w-[720px] gap-6">
      <section>
        <h2 class="text-h3">{{ t.privacy.dataTitle }}</h2>
        <p class="mt-2 text-muted">{{ t.privacy.dataBody }}</p>
      </section>

      <section>
        <h2 class="text-h3">{{ t.privacy.purposeTitle }}</h2>
        <p class="mt-2 text-muted">{{ t.privacy.purposeBody }}</p>
      </section>

      <section>
        <h2 class="text-h3">{{ t.privacy.retentionTitle }}</h2>
        <p class="mt-2 text-muted">{{ t.privacy.retentionBody }}</p>
      </section>

      <section>
        <h2 class="text-h3">{{ t.privacy.testimonialTitle }}</h2>
        <p class="mt-2 text-muted">{{ t.privacy.testimonialBody }}</p>
      </section>

      <section>
        <h2 class="text-h3">{{ t.privacy.deletionTitle }}</h2>
        <p class="mt-2 text-muted">{{ t.privacy.deletionBody(WHATSAPP_DISPLAY) }}</p>
        <AppButton variant="secondary" :href="whatsappUrl(t.privacy.deletionMessage)" class="mt-3">
          {{ t.privacy.deletionCta }}
        </AppButton>
      </section>
    </div>
  </div>
</template>
