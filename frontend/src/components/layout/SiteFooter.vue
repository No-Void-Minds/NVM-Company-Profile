<script setup lang="ts">
import ExternalLink from '@/components/ExternalLink.vue'
import { MARKETPLACE_LINKS, WHATSAPP_DISPLAY, whatsappUrl } from '@/composables/site'
import { useI18n } from '@/i18n'

const { t, to } = useI18n()
</script>

<template>
  <footer class="border-t border-line bg-surface">
    <div class="wrap grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr] lg:py-8">
      <div>
        <p class="text-h3">No Void Minds</p>
        <p class="mt-1 text-muted">Bandung</p>
      </div>

      <div>
        <p class="spec-label mb-1">{{ t.footer.contact }}</p>
        <a
          :href="whatsappUrl(t.footer.whatsappMessage)"
          target="_blank"
          rel="noopener"
          class="text-link"
        >
          WhatsApp {{ WHATSAPP_DISPLAY }}
        </a>
      </div>

      <div>
        <p class="spec-label mb-1">{{ t.footer.store }}</p>
        <ul>
          <li v-for="link in MARKETPLACE_LINKS" :key="link.label">
            <ExternalLink :href="link.url" class="text-link">{{ link.label }}</ExternalLink>
          </li>
          <li>
            <RouterLink :to="to('/privasi')" class="text-link">{{ t.footer.privacy }}</RouterLink>
          </li>
        </ul>
      </div>
    </div>
  </footer>
</template>
