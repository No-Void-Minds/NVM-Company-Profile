<script setup lang="ts">
import { ref } from 'vue'
import { adminApi, errorMessage } from '@/api/client'
import type { Collab, Tech } from '@/api/types'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import { techName } from '@/composables/site'
import { useAsync } from '@/composables/useAsync'

const techs = useAsync(() => adminApi.techs())
const collabs = useAsync(() => adminApi.collabs())
const actionError = ref('')
// Keys of rows waiting for the server, so a row cannot be toggled twice at once.
const saving = ref(new Set<string>())

// No optimistic update: the row only changes to what the PATCH response says was saved,
// so a failed request leaves the button on its previous status.
async function save<T extends { key: string }>(
  key: string,
  request: () => Promise<T>,
  rows: { value: T[] | null },
) {
  if (saving.value.has(key)) return
  actionError.value = ''
  saving.value.add(key)
  try {
    const updated = await request()
    rows.value = (rows.value ?? []).map((row) => (row.key === updated.key ? updated : row))
  } catch (err) {
    actionError.value = `Status tidak tersimpan: ${errorMessage(err)}`
  } finally {
    saving.value.delete(key)
  }
}

function toggleTech(tech: Tech) {
  return save(`tech:${tech.key}`, () => adminApi.setTechOnRack(tech.key, !tech.on_rack), techs.data)
}

function toggleCollab(collab: Collab) {
  return save(
    `collab:${collab.key}`,
    () => adminApi.setCollabAvailable(collab.key, !collab.available),
    collabs.data,
  )
}
</script>

<template>
  <h1 class="text-h2">Tech dan collab</h1>
  <p class="mt-2 max-w-[60ch] text-muted">
    Perubahan terlihat di situs publik paling lama satu menit kemudian.
  </p>
  <div aria-live="assertive">
    <p v-if="actionError" class="field-error">{{ actionError }}</p>
  </div>

  <div class="mt-4 grid gap-6 lg:grid-cols-2">
    <section aria-labelledby="catalog-tech">
      <h2 id="catalog-tech" class="text-h3">Status on the rack</h2>
      <StateLoading v-if="techs.loading.value" label="Memuat tech" class="mt-2" />
      <StateError
        v-else-if="techs.error.value"
        :message="techs.error.value"
        class="mt-2"
        @retry="techs.run"
      />
      <StateEmpty
        v-else-if="(techs.data.value ?? []).length === 0"
        title="Belum ada tech"
        class="mt-2"
      />
      <ul v-else class="mt-2 border-t border-line">
        <li
          v-for="tech in techs.data.value"
          :key="tech.key"
          class="flex items-center justify-between gap-2 border-b border-line py-1"
        >
          <span>{{ techName(tech.name) }}</span>
          <button
            type="button"
            class="btn btn-secondary min-h-[44px]"
            :aria-busy="saving.has(`tech:${tech.key}`)"
            @click="toggleTech(tech)"
          >
            <span class="sr-only">{{ tech.name }}: </span>
            {{ tech.on_rack ? 'On the rack' : 'Belum tersedia' }}
          </button>
        </li>
      </ul>
    </section>

    <section aria-labelledby="catalog-collab">
      <h2 id="catalog-collab" class="text-h3">Status collab</h2>
      <StateLoading v-if="collabs.loading.value" label="Memuat collab" class="mt-2" />
      <StateError
        v-else-if="collabs.error.value"
        :message="collabs.error.value"
        class="mt-2"
        @retry="collabs.run"
      />
      <StateEmpty
        v-else-if="(collabs.data.value ?? []).length === 0"
        title="Belum ada collab"
        class="mt-2"
      />
      <ul v-else class="mt-2 border-t border-line">
        <li
          v-for="collab in collabs.data.value"
          :key="collab.key"
          class="flex items-center justify-between gap-2 border-b border-line py-1"
        >
          <span>{{ collab.name }}</span>
          <button
            type="button"
            class="btn btn-secondary min-h-[44px]"
            :aria-busy="saving.has(`collab:${collab.key}`)"
            @click="toggleCollab(collab)"
          >
            <span class="sr-only">{{ collab.name }}: </span>
            {{ collab.available ? 'Tersedia' : 'Coming soon' }}
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>
