<script setup lang="ts">
import IconSvg from '@/components/IconSvg.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/composables/site'
import { useI18n } from '@/i18n'

const { t } = useI18n()
</script>

<template>
  <div class="wrap section">
    <SectionHeading level="h1" :number="t.contact.number" :title="t.contact.title" />
    <p class="mt-3 max-w-[48ch] text-h3">{{ t.contact.lead }}</p>

    <ul class="mt-6 border-t border-line">
      <li v-for="topic in t.contact.topics" :key="topic.title" class="border-b border-line">
        <a :href="whatsappUrl(topic.message)" target="_blank" rel="noopener" class="contact-row">
          <span class="flex-1 text-h3">{{ topic.title }}</span>
          <span class="spec-label hidden sm:inline">WhatsApp</span>
          <IconSvg name="arrow-right" />
        </a>
      </li>
    </ul>

    <p class="mt-3 text-muted">{{ t.contact.footnote(WHATSAPP_DISPLAY) }}</p>
  </div>
</template>

<style scoped>
.contact-row {
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 72px;
  padding-block: 8px;
}

.contact-row:active {
  background: var(--raised);
}

@media (hover: hover) {
  .contact-row:hover {
    background: var(--raised);
  }
}
</style>
