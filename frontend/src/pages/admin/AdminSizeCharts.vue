<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { adminApi, ApiError, errorMessage } from '@/api/client'
import type { SizeChart } from '@/api/types'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import FormField from '@/components/FormField.vue'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import { sizeChartKey } from '@/composables/site'
import { useAsync } from '@/composables/useAsync'
import { parseSizeChart } from '@/composables/useSizeRecommendation'

const { data, error, loading, run } = useAsync(() => adminApi.sizeCharts())
const techs = useAsync(() => adminApi.techs().catch(() => []))
const items = computed(() => data.value ?? [])

const keyOptions = computed(() =>
  (techs.data.value ?? []).flatMap((tech) =>
    tech.fits.length > 0
      ? tech.fits.map((fit) => sizeChartKey(tech.key, fit))
      : [sizeChartKey(tech.key, null)],
  ),
)

const blank = () => ({ key: '', title: '', rows: '', note: '' })
const form = reactive(blank())
const editing = ref(false)
const fields = ref<Record<string, string>>({})
const formError = ref('')
const saving = ref(false)
const deleting = ref<SizeChart | null>(null)
const listError = ref('')

const preview = computed(() => (form.rows.trim() ? parseSizeChart(form.rows) : null))

function resetForm() {
  Object.assign(form, blank())
  editing.value = false
  fields.value = {}
  formError.value = ''
}

function edit(chart: SizeChart) {
  resetForm()
  editing.value = true
  Object.assign(form, { key: chart.key, title: chart.title, rows: chart.rows, note: chart.note })
}

async function save() {
  fields.value = {}
  formError.value = ''
  if (!form.key.trim()) {
    fields.value.key = 'Key wajib diisi, contoh aezy-regular.'
    return
  }
  saving.value = true
  try {
    await adminApi.putSizeChart(form.key.trim(), {
      title: form.title,
      rows: form.rows,
      note: form.note,
    })
    resetForm()
    await run()
  } catch (err) {
    formError.value = errorMessage(err)
    if (err instanceof ApiError) fields.value = err.fields
  } finally {
    saving.value = false
  }
}

async function confirmDelete() {
  const target = deleting.value
  deleting.value = null
  if (!target) return
  listError.value = ''
  try {
    await adminApi.deleteSizeChart(target.key)
    if (form.key === target.key) resetForm()
    await run()
  } catch (err) {
    listError.value = errorMessage(err)
  }
}
</script>

<template>
  <h1 class="text-h2">Size chart</h1>

  <form
    class="mt-3 grid max-w-[800px] gap-2 border border-line p-3"
    novalidate
    @submit.prevent="save"
  >
    <h2 class="text-h3">{{ editing ? `Ubah ${form.key}` : 'Tambah size chart' }}</h2>
    <div class="grid gap-2 sm:grid-cols-2">
      <FormField
        id="chart-key"
        v-slot="f"
        label="Key"
        hint="Pola tech-fit, atau tech saja bila tanpa fit."
        :error="fields.key"
      >
        <input
          id="chart-key"
          v-model="form.key"
          class="field-input"
          list="chart-keys"
          :readonly="editing"
          :aria-describedby="f.describedby"
          :aria-invalid="f.invalid"
        />
        <datalist id="chart-keys">
          <option v-for="option in keyOptions" :key="option" :value="option"></option>
        </datalist>
      </FormField>
      <FormField id="chart-title" v-slot="f" label="Judul" :error="fields.title">
        <input
          id="chart-title"
          v-model="form.title"
          class="field-input"
          :aria-describedby="f.describedby"
          :aria-invalid="f.invalid"
        />
      </FormField>
    </div>
    <FormField
      id="chart-rows"
      v-slot="f"
      label="Baris tabel"
      hint="Baris pertama judul kolom, kolom dipisah tanda |."
      :error="fields.rows"
    >
      <textarea
        id="chart-rows"
        v-model="form.rows"
        rows="7"
        class="field-input font-mono"
        spellcheck="false"
        :aria-describedby="f.describedby"
        :aria-invalid="f.invalid"
      ></textarea>
    </FormField>
    <FormField id="chart-note" v-slot="f" label="Catatan" optional :error="fields.note">
      <textarea
        id="chart-note"
        v-model="form.note"
        rows="2"
        class="field-input"
        :aria-describedby="f.describedby"
        :aria-invalid="f.invalid"
      ></textarea>
    </FormField>

    <div v-if="preview">
      <p class="spec-label">Pratinjau tabel</p>
      <div
        class="scroll-x mt-1 border border-line"
        tabindex="0"
        role="region"
        aria-label="Pratinjau tabel size chart"
      >
        <table class="spec-table">
          <thead>
            <tr>
              <th v-for="header in preview.headers" :key="header" scope="col">{{ header }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, index) in preview.rows" :key="index">
              <td v-for="(cell, cellIndex) in row.cells" :key="cellIndex">{{ cell }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <p v-if="formError" role="alert" class="field-error">{{ formError }}</p>
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Menyimpan' : 'Simpan size chart' }}
      </button>
      <button v-if="editing" type="button" class="btn btn-secondary" @click="resetForm">
        Batal ubah
      </button>
    </div>
  </form>

  <p v-if="listError" role="alert" class="field-error">{{ listError }}</p>
  <StateLoading v-if="loading" label="Memuat size chart" class="mt-4" />
  <StateError v-else-if="error" :message="error" class="mt-4" @retry="run" />
  <StateEmpty v-else-if="items.length === 0" title="Belum ada size chart" class="mt-4" />
  <ul v-else class="mt-4 border-t border-line">
    <li
      v-for="chart in items"
      :key="chart.key"
      class="flex flex-wrap items-center gap-2 border-b border-line py-2"
    >
      <div class="min-w-[200px] flex-1">
        <p>{{ chart.title }}</p>
        <p class="spec-label">{{ chart.key }}</p>
      </div>
      <div class="flex flex-wrap gap-1">
        <button type="button" class="btn btn-secondary min-h-[44px]" @click="edit(chart)">
          Ubah
        </button>
        <button type="button" class="btn btn-secondary min-h-[44px]" @click="deleting = chart">
          Hapus
        </button>
      </div>
    </li>
  </ul>

  <ConfirmDialog
    :open="deleting !== null"
    title="Hapus size chart ini?"
    :message="`Pengunjung akan melihat pesan belum tersedia untuk ${deleting?.key ?? ''}.`"
    confirm-label="Hapus size chart"
    @confirm="confirmDelete"
    @cancel="deleting = null"
  />
</template>
