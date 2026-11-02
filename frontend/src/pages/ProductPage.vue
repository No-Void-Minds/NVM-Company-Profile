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

const FIT_ORDER = ['Regular', 'Fitted', 'Mini Fitted', 'Oversized', 'Boxy', 'Polo']

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
      number="Produk"
      title="Core dan Graphic"
      lead="Core dipilih dari tech dan fit. Graphic dipilih dari collab. Harga dan stok selalu mengikuti toko Shopify."
    />

    <div class="mt-6 grid gap-8 xl:grid-cols-[minmax(0,5fr)_minmax(0,2fr)] xl:gap-6">
      <section aria-labelledby="core-title">
        <div class="flex flex-wrap items-end justify-between gap-2">
          <h2 id="core-title" class="text-h2">Core</h2>
          <AppButton variant="link" :href="collectionUrl('core')">Lihat semua Core</AppButton>
        </div>
        <p class="mt-1 max-w-[56ch] text-muted">
          Semua produk selain collab. Pilih tech, lalu fit.
        </p>

        <StateLoading
          v-if="techs.loading.value"
          label="Memuat matriks"
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
          title="Daftar tech belum tersedia"
          class="mt-3"
        />
        <div
          v-else
          class="scroll-x mt-3 border border-line"
          tabindex="0"
          role="region"
          aria-label="Matriks tech dan fit, bisa digeser ke samping"
        >
          <table class="spec-table min-w-[720px]">
            <caption class="sr-only">
              Kombinasi tech dan fit lini Core, setiap sel menuju koleksi di Shopify
            </caption>
            <thead>
              <tr>
                <th scope="col">Tech</th>
                <th v-for="fit in fits" :key="fit" scope="col">{{ fit }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="tech in techs.data.value" :key="tech.key">
                <th scope="row" class="font-normal whitespace-nowrap">
                  <RouterLink :to="`/teknologi#lab-${tech.key}`" class="text-link">
                    {{ techName(tech.name) }}
                  </RouterLink>
                </th>
                <td v-if="tech.fits.length === 0" :colspan="fits.length">
                  <a
                    :href="collectionUrl('core', tech.key)"
                    target="_blank"
                    rel="noopener"
                    class="text-link"
                    :aria-label="`${tech.name} di Shopify, tanpa pilihan fit`"
                  >
                    Tanpa pilihan fit
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
                      :aria-label="`${tech.name} ${fit} di Shopify`"
                    >
                      Lihat
                    </a>
                    <span v-else class="text-line-strong">
                      <span aria-hidden="true">-</span>
                      <span class="sr-only">Tidak tersedia</span>
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
          <AppButton variant="link" :href="collectionUrl('graphic')">Lihat semua Graphic</AppButton>
        </div>
        <p class="mt-1 text-muted">Produk collab karakter berlisensi.</p>

        <StateLoading
          v-if="collabs.loading.value"
          label="Memuat daftar collab"
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
          title="Daftar collab belum tersedia"
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
              :aria-label="`${collab.name} di Shopify`"
            >
              Lihat
            </a>
            <span v-else class="spec-label">Coming soon</span>
          </li>
        </ul>
      </section>
    </div>
  </div>
</template>
