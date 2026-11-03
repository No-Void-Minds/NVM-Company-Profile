<script setup lang="ts">
import { computed, ref } from 'vue'
import { adminApi, errorMessage } from '@/api/client'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import { useAsync } from '@/composables/useAsync'

const settings = useAsync(() => adminApi.settings())
const gate = computed(() => settings.data.value?.password_gate ?? null)
const confirming = ref(false)
const saving = ref(false)
const actionError = ref('')

const timeFormatter = new Intl.DateTimeFormat('id-ID', {
  dateStyle: 'long',
  timeStyle: 'short',
  timeZone: 'Asia/Jakarta',
})

// Both directions change who can see the site at once, so each needs a confirmation (FR-125).
const dialog = computed(() =>
  gate.value?.enabled
    ? {
        title: 'Buka situs untuk semua orang?',
        message:
          'Halaman password akan dimatikan. Semua orang, termasuk mesin pencari, langsung bisa membuka seluruh situs dan API publiknya.',
        confirm: 'Matikan halaman password',
      }
    : {
        title: 'Kunci situs dengan halaman password?',
        message:
          'Pengunjung tanpa akun admin langsung hanya melihat halaman password. Mesin pencari diminta tidak mengindeks situs. Tim tetap bisa masuk dengan akun admin.',
        confirm: 'Aktifkan halaman password',
      },
)

async function apply() {
  if (!gate.value || saving.value) return
  confirming.value = false
  saving.value = true
  actionError.value = ''
  try {
    const updated = await adminApi.setPasswordGate(!gate.value.enabled)
    settings.data.value = { password_gate: updated }
  } catch (err) {
    actionError.value = `Perubahan tidak tersimpan: ${errorMessage(err)}`
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <h1 class="text-h2">Pengaturan</h1>

  <section aria-labelledby="gate-title" class="mt-4 max-w-[720px] border border-line p-3">
    <h2 id="gate-title" class="text-h3">Halaman password</h2>
    <p class="mt-1 text-muted">
      Saat aktif, pengunjung hanya melihat halaman password. Tim masuk dengan akun admin.
    </p>

    <StateLoading
      v-if="settings.loading.value"
      label="Memuat pengaturan"
      height="120px"
      class="mt-3"
    />
    <StateError
      v-else-if="settings.error.value"
      :message="settings.error.value"
      class="mt-3"
      @retry="settings.run"
    />

    <template v-else-if="gate">
      <dl class="mt-3 grid gap-2 sm:grid-cols-2">
        <div>
          <dt class="spec-label">Status sekarang</dt>
          <dd class="mt-1" :class="{ 'text-signal': gate.enabled }">
            {{ gate.enabled ? 'Aktif, situs terkunci' : 'Mati, situs terbuka untuk semua orang' }}
          </dd>
        </div>
        <div>
          <dt class="spec-label">Terakhir diubah</dt>
          <dd class="mt-1">
            <template v-if="gate.updated_by">
              {{ timeFormatter.format(new Date(gate.updated_at)) }} oleh {{ gate.updated_by }}
            </template>
            <template v-else>Belum pernah diubah sejak dipasang</template>
          </dd>
        </div>
      </dl>
      <button
        type="button"
        class="btn btn-secondary mt-3"
        :disabled="saving"
        :aria-busy="saving"
        @click="confirming = true"
      >
        {{ gate.enabled ? 'Matikan halaman password' : 'Aktifkan halaman password' }}
      </button>
    </template>

    <div aria-live="assertive">
      <p v-if="actionError" class="field-error">{{ actionError }}</p>
    </div>
  </section>

  <ConfirmDialog
    :open="confirming"
    :title="dialog.title"
    :message="dialog.message"
    :confirm-label="dialog.confirm"
    @confirm="apply"
    @cancel="confirming = false"
  />
</template>
