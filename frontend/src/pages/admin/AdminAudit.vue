<script setup lang="ts">
import { adminApi } from '@/api/client'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import { useAsync } from '@/composables/useAsync'

const ACTION_LABEL: Record<string, string> = {
  create: 'Membuat',
  update: 'Mengubah',
  save: 'Menyimpan',
  delete: 'Menghapus',
}

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
})

const { data, error, loading, run } = useAsync(() => adminApi.auditLog())
</script>

<template>
  <h1 class="text-h2">Log audit</h1>
  <p class="mt-2 text-muted">200 perubahan terakhir oleh admin.</p>

  <StateLoading v-if="loading" label="Memuat log audit" class="mt-4" />
  <StateError v-else-if="error" :message="error" class="mt-4" @retry="run" />
  <StateEmpty v-else-if="(data ?? []).length === 0" title="Belum ada perubahan" class="mt-4" />
  <div
    v-else
    class="scroll-x mt-4 border border-line"
    tabindex="0"
    role="region"
    aria-label="Log audit, bisa digeser ke samping"
  >
    <table class="spec-table min-w-[640px]">
      <thead>
        <tr>
          <th scope="col">Waktu (WIB)</th>
          <th scope="col">Admin</th>
          <th scope="col">Aksi</th>
          <th scope="col">Data</th>
          <th scope="col">ID</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in data" :key="row.id">
          <td class="whitespace-nowrap">{{ timeFormatter.format(new Date(row.at)) }}</td>
          <td>{{ row.username ?? 'Akun terhapus' }}</td>
          <td>{{ ACTION_LABEL[row.action] ?? row.action }}</td>
          <td>{{ row.entity }}</td>
          <td class="font-mono break-all">{{ row.entity_id }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
