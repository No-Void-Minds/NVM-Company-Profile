<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { api, ApiError } from '@/api/client'
import AppButton from '@/components/AppButton.vue'
import FormField from '@/components/FormField.vue'
import IconSvg from '@/components/IconSvg.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import { collectionUrl, sizeChartKey, techName, whatsappUrl } from '@/composables/site'
import { useAsync } from '@/composables/useAsync'
import {
  parseSizeChart,
  recommendByGarment,
  recommendByHeight,
} from '@/composables/useSizeRecommendation'

type Mode = 'height' | 'garment'

const route = useRoute()
const techs = useAsync(() => api.techs())

const techKey = ref('')
const fit = ref('')
const mode = ref<Mode>('height')
const height = ref<number | null>(null)
const garmentWidth = ref<number | null>(null)
const garmentLength = ref<number | null>(null)

const tech = computed(() => (techs.data.value ?? []).find((t) => t.key === techKey.value) ?? null)

watch(techs.data, (list) => {
  if (!list || list.length === 0) return
  const fromQuery = list.find((t) => t.key === route.query.tech)
  techKey.value = (fromQuery ?? list[0]).key
  const wanted = String(route.query.fit ?? '')
  if ((fromQuery ?? list[0]).fits.includes(wanted)) fit.value = wanted
})

watch(tech, (current) => {
  if (current && !current.fits.includes(fit.value)) fit.value = current.fits[0] ?? ''
})

const chartKey = computed(() => (tech.value ? sizeChartKey(tech.value.key, fit.value || null) : ''))
const comboLabel = computed(() =>
  tech.value ? [techName(tech.value.name), fit.value].filter(Boolean).join(' ') : '',
)

// A 404 is an answer here (FR-75), only other failures count as errors.
const chart = useAsync(
  () =>
    api.sizeChart(chartKey.value).catch((err) => {
      if (err instanceof ApiError && err.status === 404) return null
      throw err
    }),
  { immediate: false },
)

watch(chartKey, (key) => {
  if (key) void chart.run()
})

const parsed = computed(() => (chart.data.value ? parseSizeChart(chart.data.value.rows) : null))

const result = computed(() => {
  if (!parsed.value) return null
  if (mode.value === 'height') {
    if (height.value === null || height.value < 50 || height.value > 260) return null
    return recommendByHeight(parsed.value, height.value)
  }
  if (!garmentWidth.value || !garmentLength.value) return null
  return recommendByGarment(parsed.value, garmentWidth.value, garmentLength.value)
})

const selected = computed(() => result.value?.sizes ?? [])

const shopUrl = computed(() =>
  tech.value
    ? collectionUrl(...['core', tech.value.key, fit.value].filter(Boolean))
    : collectionUrl('core'),
)

const askWhatsapp = computed(() => {
  const sizes = selected.value.length > 0 ? `, hasilnya ${selected.value.join(' atau ')}` : ''
  return whatsappUrl(
    `Halo NVM, saya ingin bertanya ukuran ${tech.value?.name ?? ''} ${fit.value}${sizes}.`.replace(
      /\s+/g,
      ' ',
    ),
  )
})

const tabs: Array<{ key: Mode; label: string }> = [
  { key: 'height', label: 'Dari tinggi badan' },
  { key: 'garment', label: 'Dari kaos favorit' },
]

function onTabKeydown(event: KeyboardEvent) {
  if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
  event.preventDefault()
  mode.value = mode.value === 'height' ? 'garment' : 'height'
  void nextTick(() => document.getElementById(`tab-${mode.value}`)?.focus())
}

// Size marker: one bar slides to the chosen rows instead of each row lighting up alone.
const tableWrap = ref<HTMLElement | null>(null)
const markerStyle = ref<Record<string, string> | null>(null)

function placeMarker() {
  const wrap = tableWrap.value
  const rows = wrap?.querySelectorAll<HTMLElement>('tr[data-selected="true"]')
  if (!wrap || !rows || rows.length === 0) {
    markerStyle.value = null
    return
  }
  const origin = wrap.getBoundingClientRect()
  const top = rows[0].getBoundingClientRect().top - origin.top
  const bottom = rows[rows.length - 1].getBoundingClientRect().bottom - origin.top
  markerStyle.value = { transform: `translateY(${top}px)`, height: `${bottom - top}px` }
}

watch([selected, parsed, mode], () => void nextTick(placeMarker))

if (!import.meta.env.SSR) {
  window.addEventListener('resize', placeMarker)
  onBeforeUnmount(() => window.removeEventListener('resize', placeMarker))
}
</script>

<template>
  <div class="wrap section">
    <SectionHeading
      level="h1"
      number="Size"
      title="Cari ukuranmu"
      lead="Hitungan memakai size chart resmi per tech dan fit. Kalau datanya belum ada, kami bilang belum ada."
    />

    <StateLoading v-if="techs.loading.value" label="Memuat pilihan tech" class="mt-6" />
    <StateError
      v-else-if="techs.error.value"
      :message="techs.error.value"
      class="mt-6"
      @retry="techs.run"
    />
    <StateEmpty v-else-if="!tech" title="Daftar tech belum tersedia" class="mt-6" />

    <div v-else class="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-6">
      <div class="grid content-start gap-3">
        <FormField id="size-tech" v-slot="f" label="Tech">
          <select
            id="size-tech"
            v-model="techKey"
            class="field-input"
            :aria-describedby="f.describedby"
          >
            <option v-for="item in techs.data.value" :key="item.key" :value="item.key">
              {{ techName(item.name) }}
            </option>
          </select>
        </FormField>

        <FormField v-if="tech.fits.length > 0" id="size-fit" v-slot="f" label="Fit">
          <select id="size-fit" v-model="fit" class="field-input" :aria-describedby="f.describedby">
            <option v-for="item in tech.fits" :key="item" :value="item">{{ item }}</option>
          </select>
        </FormField>
        <p v-else class="text-muted">{{ techName(tech.name) }} tidak punya pilihan fit.</p>

        <div>
          <div role="tablist" aria-label="Cara mencari ukuran" class="flex border-b border-line">
            <button
              v-for="tab in tabs"
              :id="`tab-${tab.key}`"
              :key="tab.key"
              type="button"
              role="tab"
              class="tab-button"
              :aria-selected="mode === tab.key"
              :aria-controls="`panel-${tab.key}`"
              :tabindex="mode === tab.key ? 0 : -1"
              @click="mode = tab.key"
              @keydown="onTabKeydown"
            >
              {{ tab.label }}
            </button>
          </div>

          <div
            v-if="mode === 'height'"
            id="panel-height"
            role="tabpanel"
            aria-labelledby="tab-height"
            class="pt-3"
          >
            <FormField id="size-height" v-slot="f" label="Tinggi badan (cm)">
              <input
                id="size-height"
                v-model.number="height"
                type="number"
                inputmode="decimal"
                min="50"
                max="260"
                class="field-input"
                :aria-describedby="f.describedby"
              />
            </FormField>
          </div>

          <div
            v-else
            id="panel-garment"
            role="tabpanel"
            aria-labelledby="tab-garment"
            class="grid gap-2 pt-3 sm:grid-cols-2"
          >
            <FormField id="size-width" v-slot="f" label="Lebar badan kaos (cm)">
              <input
                id="size-width"
                v-model.number="garmentWidth"
                type="number"
                inputmode="decimal"
                min="1"
                step="0.5"
                class="field-input"
                :aria-describedby="f.describedby"
              />
            </FormField>
            <FormField id="size-length" v-slot="f" label="Panjang badan kaos (cm)">
              <input
                id="size-length"
                v-model.number="garmentLength"
                type="number"
                inputmode="decimal"
                min="1"
                step="0.5"
                class="field-input"
                :aria-describedby="f.describedby"
              />
            </FormField>
          </div>
        </div>
      </div>

      <section aria-labelledby="size-result-title">
        <h2 id="size-result-title" class="text-h3">{{ comboLabel }}</h2>

        <StateLoading v-if="chart.loading.value" label="Memuat size chart" class="mt-3" />
        <StateError
          v-else-if="chart.error.value"
          :message="chart.error.value"
          class="mt-3"
          @retry="chart.run"
        />
        <StateEmpty
          v-else-if="!parsed"
          title="Size chart untuk kombinasi ini belum tersedia"
          message="Tanyakan langsung ke tim NVM, kami tidak menebak ukuran tanpa data."
          class="mt-3"
        >
          <AppButton :href="askWhatsapp">
            <IconSvg name="chat" />
            Tanya ukuran lewat WhatsApp
          </AppButton>
        </StateEmpty>

        <template v-else>
          <p class="mt-2 min-h-[56px]" role="status">
            <template v-if="result && result.between">
              Hasilmu ada di antara
              <strong class="font-normal text-signal">{{ selected[0] }}</strong> dan
              <strong class="font-normal text-signal">{{ selected[1] }}</strong
              >. Tanyakan pilihan terbaiknya lewat WhatsApp.
            </template>
            <template v-else-if="result">
              Rekomendasi:
              <strong class="text-h2 font-normal text-signal">{{ selected[0] }}</strong>
            </template>
            <template v-else>
              <span class="text-muted">Isi data di samping untuk melihat rekomendasi.</span>
            </template>
          </p>

          <div
            ref="tableWrap"
            class="scroll-x relative mt-2 border border-line"
            tabindex="0"
            role="region"
            aria-label="Tabel size chart, bisa digeser ke samping"
          >
            <div
              v-if="markerStyle"
              class="size-marker"
              :style="markerStyle"
              aria-hidden="true"
            ></div>
            <table class="spec-table relative min-w-[560px]">
              <caption class="sr-only">
                {{
                  chart.data.value?.title
                }}
              </caption>
              <thead>
                <tr>
                  <th v-for="header in parsed.headers" :key="header" scope="col">{{ header }}</th>
                  <th v-if="result && mode === 'garment'" scope="col">Selisih (cm)</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="row in parsed.rows"
                  :key="row.size"
                  :data-selected="selected.includes(row.size)"
                  :aria-current="selected.includes(row.size) ? 'true' : undefined"
                >
                  <td v-for="(cell, index) in row.cells" :key="index">
                    {{ cell }}
                    <span v-if="index === 0 && selected.includes(row.size)" class="sr-only">
                      (ukuran terpilih)
                    </span>
                  </td>
                  <td v-if="result && mode === 'garment'">{{ result.differences[row.size] }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <ul class="field-hint">
            <li>Toleransi 1 sampai 2 cm.</li>
            <li>Tinggi badan hanya rekomendasi.</li>
          </ul>
          <p v-if="chart.data.value?.note" class="field-hint whitespace-pre-line" lang="en">
            {{ chart.data.value.note }}
          </p>

          <div class="mt-3 flex flex-wrap gap-2">
            <AppButton :href="shopUrl">Lihat ukuran ini di Shopify</AppButton>
            <AppButton :href="askWhatsapp" :variant="result?.between ? 'primary' : 'secondary'">
              <IconSvg name="chat" />
              Tanya ukuran lewat WhatsApp
            </AppButton>
          </div>
        </template>
      </section>
    </div>
  </div>
</template>

<style scoped>
.tab-button {
  flex: 1;
  min-height: 48px;
  padding: 8px;
  color: var(--color-muted);
  border-bottom: 2px solid transparent;
  cursor: pointer;
}

.tab-button:active {
  background: var(--color-raised);
}

.tab-button[aria-selected='true'] {
  color: var(--color-bone);
  border-bottom-color: var(--color-bone);
}

.size-marker {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  min-width: 560px;
  background: var(--color-raised);
  border-left: 2px solid var(--color-signal);
  transition:
    transform 240ms ease,
    height 240ms ease;
}
</style>
