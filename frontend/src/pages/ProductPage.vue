<script setup lang="ts">
import { computed } from 'vue'
import { api } from '@/api/client'
import AppButton from '@/components/AppButton.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import { collectionUrl, techName } from '@/composables/site'
import { useAsync } from '@/composables/useAsync'
import { useI18n } from '@/i18n'

const FIT_ORDER = ['Regular', 'Fitted', 'Mini Fitted', 'Oversized', 'Boxy', 'Polo']

const { t, to } = useI18n()
const techs = useAsync(() => api.techs())
const collabs = useAsync(() => api.collabs())

const fits = computed(() =>
  FIT_ORDER.filter((fit) => (techs.data.value ?? []).some((t) => t.fits.includes(fit))),
)
</script>

<template>
  <div class="wrap section">
    <SectionHeading
      level="h1"
      :number="t.product.number"
      :title="t.product.title"
      :lead="t.product.lead"
    />

    <div class="mt-6 grid gap-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,2fr)] xl:gap-6">
      <section aria-labelledby="core-title">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <h2 id="core-title" class="text-h2">Core</h2>
          <AppButton variant="link" :href="collectionUrl('core')">{{
            t.product.coreAll
          }}</AppButton>
        </div>
        <p class="mt-1 max-w-[56ch] text-muted">{{ t.product.coreBody }}</p>

        <StateLoading
          v-if="techs.loading.value"
          :label="t.product.matrixLoading"
          height="400px"
          class="mt-3"
        />
        <StateError
          v-else-if="techs.error.value"
          :message="techs.error.value"
          class="mt-3"
          @retry="techs.run"
        />
        <StateEmpty
          v-else-if="(techs.data.value ?? []).length === 0"
          :title="t.product.techEmpty"
          class="mt-3"
        />
        <div
          v-else
          class="scroll-x mt-3 border border-line"
          tabindex="0"
          role="region"
          :aria-label="t.product.matrixRegion"
        >
          <table class="spec-table min-w-[720px]">
            <caption class="sr-only">
              {{
                t.product.matrixCaption
              }}
            </caption>
            <thead>
              <tr>
                <th scope="col">{{ t.product.tech }}</th>
                <th v-for="fit in fits" :key="fit" scope="col">{{ fit }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tech in techs.data.value" :key="tech.key">
                <th scope="row" class="font-normal whitespace-nowrap">
                  <RouterLink :to="`${to('/teknologi')}#lab-${tech.key}`" class="text-link">
                    {{ techName(tech.name) }}
                  </RouterLink>
                </th>
                <td v-if="tech.fits.length === 0" :colspan="fits.length">
                  <a
                    :href="collectionUrl('core', tech.key)"
                    target="_blank"
                    rel="noopener"
                    class="text-link"
                    :aria-label="t.product.noFitLabel(tech.name)"
                  >
                    {{ t.product.noFit }}
                  </a>
                </td>
                <template v-else>
                  <td v-for="fit in fits" :key="fit">
                    <a
                      v-if="tech.fits.includes(fit)"
                      :href="collectionUrl('core', tech.key, fit)"
                      target="_blank"
                      rel="noopener"
                      class="text-link"
                      :aria-label="t.product.cellLabel(tech.name, fit)"
                    >
                      {{ t.product.see }}
                    </a>
                    <span v-else class="text-line-strong">
                      <span aria-hidden="true">-</span>
                      <span class="sr-only">{{ t.product.unavailable }}</span>
                    </span>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="graphic-title">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <h2 id="graphic-title" class="text-h2">Graphic</h2>
          <AppButton variant="link" :href="collectionUrl('graphic')">
            {{ t.product.graphicAll }}
          </AppButton>
        </div>
        <p class="mt-1 text-muted">{{ t.product.graphicBody }}</p>

        <StateLoading
          v-if="collabs.loading.value"
          :label="t.product.collabLoading"
          height="400px"
          class="mt-3"
        />
        <StateError
          v-else-if="collabs.error.value"
          :message="collabs.error.value"
          class="mt-3"
          @retry="collabs.run"
        />
        <StateEmpty
          v-else-if="(collabs.data.value ?? []).length === 0"
          :title="t.product.collabEmpty"
          class="mt-3"
        />
        <ul v-else class="mt-3 border-t border-line">
          <li
            v-for="collab in collabs.data.value"
            :key="collab.key"
            class="flex min-h-[56px] items-center justify-between gap-2 border-b border-line"
          >
            <span>{{ collab.name }}</span>
            <a
              v-if="collab.available"
              :href="collectionUrl('graphic', collab.key)"
              target="_blank"
              rel="noopener"
              class="text-link"
              :aria-label="t.product.collabLabel(collab.name)"
            >
              {{ t.product.see }}
            </a>
            <span v-else class="spec-label">{{ t.product.comingSoon }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
