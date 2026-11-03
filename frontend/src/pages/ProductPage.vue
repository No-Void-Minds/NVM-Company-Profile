<script setup lang="ts">
import { computed } from 'vue'
import { api } from '@/api/client'
import ExternalLink from '@/components/ExternalLink.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import SwatchView from '@/components/SwatchView.vue'
import { techLink, techName } from '@/composables/site'
import { useAsync } from '@/composables/useAsync'
import { useI18n } from '@/i18n'

const FIT_ORDER = ['Regular', 'Fitted', 'Mini Fitted', 'Oversized', 'Boxy', 'Polo']

const { lang, t, to } = useI18n()
const techs = useAsync(() => api.techs(lang.value))
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
        <h2 id="core-title" class="text-h2">Core</h2>
        <p class="mt-1 max-w-[56ch] text-muted">{{ t.product.coreBody }}</p>
        <p class="spec-label mt-1">{{ t.probe.label }}</p>

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
              <tr v-for="tech in techs.data.value" :key="tech.key" data-swatch-host>
                <th scope="row" class="font-normal whitespace-nowrap">
                  <span class="flex items-center gap-2">
                    <span class="block h-4 w-6 flex-none border border-line">
                      <SwatchView :tech="tech" />
                    </span>
                    <RouterLink :to="`${to('/teknologi')}#lab-${tech.key}`" class="text-link">
                      {{ techName(tech.name) }}
                    </RouterLink>
                  </span>
                </th>
                <td v-if="tech.fits.length === 0" :colspan="fits.length">
                  <span class="flex flex-wrap items-center gap-x-2">
                    <ExternalLink
                      v-if="techLink(tech, null)"
                      :href="techLink(tech, null)!"
                      :label="t.product.noFitLabel(techName(tech.name))"
                      class="text-link"
                    >
                      {{ t.product.see }}
                    </ExternalLink>
                    <span v-else class="text-line-strong">
                      <span aria-hidden="true">-</span>
                      <span class="sr-only">{{ t.product.noLink }}</span>
                    </span>
                    <span class="text-muted">{{ t.product.noFit }}</span>
                  </span>
                </td>
                <template v-else>
                  <!-- See only where a Shopee link exists. A fit without one shows "-" (FR-133). -->
                  <td v-for="fit in fits" :key="fit">
                    <ExternalLink
                      v-if="techLink(tech, fit)"
                      :href="techLink(tech, fit)!"
                      :label="t.product.cellLabel(techName(tech.name), fit)"
                      class="text-link"
                    >
                      {{ t.product.see }}
                    </ExternalLink>
                    <span v-else class="text-line-strong">
                      <span aria-hidden="true">-</span>
                      <span class="sr-only">{{
                        tech.fits.includes(fit) ? t.product.noLink : t.product.unavailable
                      }}</span>
                    </span>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section aria-labelledby="graphic-title">
        <h2 id="graphic-title" class="text-h2">Graphic</h2>
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
            <!-- A collab links to its Shopee collection once the admin fills in the link -->
            <ExternalLink v-if="collab.url" :href="collab.url" class="text-link">{{
              collab.name
            }}</ExternalLink>
            <span v-else>{{ collab.name }}</span>
            <span v-if="!collab.available" class="spec-label">{{ t.product.comingSoon }}</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
