<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { adminApi, errorMessage } from '@/api/client'
import type { Inquiry, InquiryStatus } from '@/api/types'
import FormField from '@/components/FormField.vue'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import { useAsync } from '@/composables/useAsync'

const STATUS_LABEL: Record<InquiryStatus, string> = {
  new: 'Baru',
  contacted: 'Dihubungi',
  done: 'Selesai',
  spam: 'Spam',
}
const KIND_LABEL = { wholesale: 'Wholesale', collaboration: 'Collaboration' }
const STATUSES = Object.keys(STATUS_LABEL) as InquiryStatus[]

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
})
const formatTime = (value: string) => `${timeFormatter.format(new Date(value))} WIB`

const kind = ref('')
const status = ref('')
const { data, error, loading, run } = useAsync(() =>
  adminApi.inquiries({ kind: kind.value, status: status.value }),
)
watch([kind, status], () => void run())

const items = computed(() => data.value ?? [])
const selectedId = ref<string | null>(null)
const selected = computed(() => items.value.find((item) => item.id === selectedId.value) ?? null)
const actionError = ref('')

async function setStatus(item: Inquiry, next: InquiryStatus) {
  actionError.value = ''
  try {
    const updated = await adminApi.setInquiryStatus(item.id, next)
    data.value = items.value.map((row) => (row.id === updated.id ? updated : row))
  } catch (err) {
    actionError.value = errorMessage(err)
  }
}
</script>

<template>
  <div class="flex flex-wrap items-end justify-between gap-2">
    <h1 class="text-h2">Inquiry B2B</h1>
    <div class="flex flex-wrap gap-1">
      <a class="btn btn-secondary min-h-[44px]" href="/api/admin/inquiries/export?format=csv">
        Ekspor CSV
      </a>
      <a class="btn btn-secondary min-h-[44px]" href="/api/admin/inquiries/export?format=xlsx">
        Ekspor XLSX
      </a>
    </div>
  </div>

  <div class="mt-3 grid max-w-[640px] gap-2 sm:grid-cols-2">
    <FormField id="filter-kind" v-slot="f" label="Jenis">
      <select id="filter-kind" v-model="kind" class="field-input" :aria-describedby="f.describedby">
        <option value="">Semua jenis</option>
        <option value="wholesale">Wholesale</option>
        <option value="collaboration">Collaboration</option>
      </select>
    </FormField>
    <FormField id="filter-status" v-slot="f" label="Status">
      <select
        id="filter-status"
        v-model="status"
        class="field-input"
        :aria-describedby="f.describedby"
      >
        <option value="">Semua status</option>
        <option v-for="value in STATUSES" :key="value" :value="value">
          {{ STATUS_LABEL[value] }}
        </option>
      </select>
    </FormField>
  </div>

  <p v-if="actionError" role="alert" class="field-error">{{ actionError }}</p>
  <StateLoading v-if="loading" label="Memuat inquiry" class="mt-4" />
  <StateError v-else-if="error" :message="error" class="mt-4" @retry="run" />
  <StateEmpty
    v-else-if="items.length === 0"
    title="Tidak ada inquiry"
    message="Belum ada kiriman yang cocok dengan filter ini."
    class="mt-4"
  />

  <div v-else class="mt-4 grid gap-4 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
    <div
      class="scroll-x border border-line"
      tabindex="0"
      role="region"
      aria-label="Daftar inquiry, bisa digeser ke samping"
    >
      <table class="spec-table min-w-[640px]">
        <thead>
          <tr>
            <th scope="col">Kode</th>
            <th scope="col">Jenis</th>
            <th scope="col">Nama</th>
            <th scope="col">Status</th>
            <th scope="col">Masuk</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in items" :key="item.id">
            <th scope="row" class="font-normal">
              <button
                type="button"
                class="text-link cursor-pointer font-mono"
                :aria-pressed="selectedId === item.id"
                @click="selectedId = item.id"
              >
                {{ item.code }}
              </button>
            </th>
            <td>{{ KIND_LABEL[item.kind] }}</td>
            <td>{{ item.name }}</td>
            <td :class="{ 'text-signal': item.status === 'new' }">
              {{ STATUS_LABEL[item.status] }}
            </td>
            <td class="whitespace-nowrap">{{ formatTime(item.created_at) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <section v-if="selected" aria-labelledby="inquiry-detail" class="border border-line p-3">
      <h2 id="inquiry-detail" class="font-mono text-h3">{{ selected.code }}</h2>
      <FormField id="detail-status" v-slot="f" label="Status" class="mt-2">
        <select
          id="detail-status"
          :value="selected.status"
          class="field-input"
          :aria-describedby="f.describedby"
          @change="
            setStatus(selected!, ($event.target as HTMLSelectElement).value as InquiryStatus)
          "
        >
          <option v-for="value in STATUSES" :key="value" :value="value">
            {{ STATUS_LABEL[value] }}
          </option>
        </select>
      </FormField>
      <dl class="detail-list mt-3">
        <dt>Jenis</dt>
        <dd>{{ KIND_LABEL[selected.kind] }}</dd>
        <dt>Nama</dt>
        <dd>{{ selected.name }}</dd>
        <dt>Usaha atau komunitas</dt>
        <dd>{{ selected.org }}</dd>
        <dt>Kota</dt>
        <dd>{{ selected.city }}</dd>
        <dt>WhatsApp</dt>
        <dd>{{ selected.phone || 'Tidak diisi' }}</dd>
        <dt>Email</dt>
        <dd>{{ selected.email || 'Tidak diisi' }}</dd>
        <dt>Kanal penjualan</dt>
        <dd>{{ selected.channels || 'Tidak diisi' }}</dd>
        <dt>Tech diminati</dt>
        <dd>{{ selected.techs.join(', ') || 'Tidak diisi' }}</dd>
        <dt>Perkiraan jumlah</dt>
        <dd>{{ selected.quantity_note || 'Tidak diisi' }}</dd>
        <dt>Pesan</dt>
        <dd class="whitespace-pre-line">{{ selected.message }}</dd>
        <dt>Persetujuan</dt>
        <dd>{{ formatTime(selected.consent_at) }}</dd>
      </dl>
    </section>
  </div>
</template>

<style scoped>
.detail-list dt {
  margin-top: 16px;
  font-family: var(--font-mono);
  font-size: var(--text-label);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
}

.detail-list dd {
  overflow-wrap: anywhere;
}
</style>
