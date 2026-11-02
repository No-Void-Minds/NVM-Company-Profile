<script setup lang="ts">
import { computed, ref } from 'vue'
import { api } from '@/api/client'
import type { Testimonial, TestimonialSource } from '@/api/types'
import FormField from '@/components/FormField.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import { techName } from '@/composables/site'
import { useAsync } from '@/composables/useAsync'
import { formatDate, formatNumber, useI18n } from '@/i18n'

const SOURCE_LABEL: Record<TestimonialSource, string> = {
  shopee: 'Shopee',
  tiktok_shop: 'TikTok Shop',
}

const { lang, t } = useI18n()

const { data, error, loading, run } = useAsync(() =>
  Promise.all([api.testimonials(), api.techs(lang.value).catch(() => [])]),
)
const items = computed<Testimonial[]>(() => data.value?.[0] ?? [])
const techs = computed(() => data.value?.[1] ?? [])

const source = ref('')
const tech = ref('')

const techLabel = (key: string | null) => {
  const found = techs.value.find((t) => t.key === key)
  return found ? techName(found.name) : ''
}

const techOptions = computed(() => [
  ...new Set(items.value.map((item) => item.tech_key).filter((key) => key !== null)),
])

const filtered = computed(() =>
  items.value.filter(
    (item) =>
      (!source.value || item.source === source.value) &&
      (!tech.value || item.tech_key === tech.value),
  ),
)

// FR-63: counted only from what is on this page, never a store-wide rating.
const rated = computed(() => filtered.value.filter((item) => item.rating !== null))
const average = computed(() => {
  if (rated.value.length === 0) return ''
  const total = rated.value.reduce((sum, item) => sum + (item.rating ?? 0), 0)
  return formatNumber(total / rated.value.length, lang.value)
})
</script>

<template>
  <div class="wrap section">
    <SectionHeading
      level="h1"
      :number="t.testimonial.number"
      :title="t.testimonial.title"
      :lead="t.testimonial.lead"
    />

    <StateLoading v-if="loading" :label="t.testimonial.loading" height="480px" class="mt-6" />
    <StateError v-else-if="error" :message="error" class="mt-6" @retry="run" />
    <StateEmpty v-else-if="items.length === 0" :title="t.testimonial.empty" class="mt-6" />

    <template v-else>
      <div class="mt-6 grid max-w-[640px] gap-2 sm:grid-cols-2">
        <FormField id="filter-source" v-slot="f" :label="t.testimonial.source">
          <select
            id="filter-source"
            v-model="source"
            class="field-input"
            :aria-describedby="f.describedby"
          >
            <option value="">{{ t.testimonial.allSources }}</option>
            <option value="shopee">Shopee</option>
            <option value="tiktok_shop">TikTok Shop</option>
          </select>
        </FormField>
        <FormField
          v-if="techOptions.length > 0"
          id="filter-tech"
          v-slot="f"
          :label="t.testimonial.tech"
        >
          <select
            id="filter-tech"
            v-model="tech"
            class="field-input"
            :aria-describedby="f.describedby"
          >
            <option value="">{{ t.testimonial.allTechs }}</option>
            <option v-for="key in techOptions" :key="key" :value="key">{{ techLabel(key) }}</option>
          </select>
        </FormField>
      </div>

      <p class="mt-3 text-muted" aria-live="polite">
        {{
          average
            ? t.testimonial.summaryWithAverage(average, filtered.length)
            : t.testimonial.summary(filtered.length)
        }}
      </p>

      <StateEmpty
        v-if="filtered.length === 0"
        :title="t.testimonial.noMatchTitle"
        :message="t.testimonial.noMatchBody"
        class="mt-4"
      />

      <ul v-else class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <li v-for="item in filtered" :key="item.id" class="border-t border-line pt-2">
          <p class="spec-label">{{ SOURCE_LABEL[item.source] }}</p>
          <p class="mt-1 text-muted">
            {{
              [formatDate(item.review_date, lang), techLabel(item.tech_key)]
                .filter(Boolean)
                .join(', ')
            }}
          </p>
          <p v-if="item.rating !== null" class="mt-1">{{ t.testimonial.rating(item.rating) }}</p>
          <img
            :src="item.image.src"
            :srcset="item.image.srcset"
            sizes="(min-width: 80rem) 33vw, (min-width: 48rem) 50vw, 100vw"
            :width="item.image.width"
            :height="item.image.height"
            :alt="t.testimonial.imageAlt(SOURCE_LABEL[item.source])"
            loading="lazy"
            decoding="async"
            class="mt-2 h-auto w-full"
          />
          <details class="mt-2">
            <summary class="text-link cursor-pointer">{{ t.testimonial.transcript }}</summary>
            <p class="mt-1 whitespace-pre-line" :lang="item.lang">{{ item.transcript }}</p>
          </details>
        </li>
      </ul>
    </template>
  </div>
</template>
