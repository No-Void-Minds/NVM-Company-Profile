<script setup lang="ts">
import IconSvg from '@/components/IconSvg.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import { WHATSAPP_DISPLAY, whatsappUrl } from '@/composables/site'

const TOPICS = [
  { title: 'Which system is for me?', message: 'Halo NVM, saya ingin tanya system yang cocok.' },
  { title: 'Wholesale', message: 'Halo NVM, saya ingin tanya soal wholesale.' },
  { title: 'Collaboration', message: 'Halo NVM, saya ingin tanya soal collaboration.' },
]
</script>

<template>
  <div class="wrap section">
    <SectionHeading level="h1" number="Kontak" title="Bicara dengan tim NVM" />
    <p class="mt-3 max-w-[48ch] text-h3" lang="en">
      A real person on the team answers, usually within one working day.
    </p>

    <ul class="mt-6 border-t border-line">
      <li v-for="topic in TOPICS" :key="topic.title" class="border-b border-line">
        <a :href="whatsappUrl(topic.message)" target="_blank" rel="noopener" class="contact-row">
          <span class="flex-1 text-h3" lang="en">{{ topic.title }}</span>
          <span class="spec-label hidden sm:inline">WhatsApp</span>
          <IconSvg name="arrow-right" />
        </a>
      </li>
    </ul>

    <p class="mt-3 text-muted">WhatsApp {{ WHATSAPP_DISPLAY }}, Bandung.</p>
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
