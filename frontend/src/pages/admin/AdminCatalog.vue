<script setup lang="ts">
import { reactive, ref, watch } from 'vue'
import { adminApi, ApiError, errorMessage } from '@/api/client'
import type { Collab, Tech, TechLink } from '@/api/types'
import FormField from '@/components/FormField.vue'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import { handleize, techLink, techName } from '@/composables/site'
import { shopeeUrlError } from '@/composables/shopeeUrl'
import { useAsync } from '@/composables/useAsync'

const techs = useAsync(() => adminApi.techs())
const collabs = useAsync(() => adminApi.collabs())
const actionError = ref('')
const savedNote = ref('')
// Keys of rows waiting for the server, so a row cannot be saved twice at once.
const saving = ref(new Set<string>())

// Link fields being edited: per tech, keyed by fit ('' for the fit-less link), and per collab
const techDrafts = reactive<Record<string, Record<string, string>>>({})
const collabDrafts = reactive<Record<string, string>>({})
const fieldErrors = reactive<Record<string, string>>({})

// A tech with fits gets one field per fit, a tech without fits one field (FR-137)
function slots(tech: Tech): (string | null)[] {
  return tech.fits.length > 0 ? tech.fits : [null]
}

function fillTechDraft(tech: Tech) {
  techDrafts[tech.key] = Object.fromEntries(
    slots(tech).map((fit) => [fit ?? '', techLink(tech, fit) ?? '']),
  )
}

watch(
  () => techs.data.value,
  (rows) => rows?.forEach((tech) => techDrafts[tech.key] ?? fillTechDraft(tech)),
  { immediate: true },
)
watch(
  () => collabs.data.value,
  (rows) => rows?.forEach((c) => (collabDrafts[c.key] ??= c.url ?? '')),
  { immediate: true },
)

function fieldId(owner: string, fit: string | null) {
  return `link-${owner}-${fit ? handleize(fit) : 'tanpa-fit'}`
}

// No optimistic update: the row only changes to what the PATCH response says was saved,
// so a failed request leaves it as it was.
async function save<T extends { key: string }>(
  key: string,
  request: () => Promise<T>,
  rows: { value: T[] | null },
): Promise<{ row: T | null; error: unknown }> {
  if (saving.value.has(key)) return { row: null, error: null }
  actionError.value = ''
  savedNote.value = ''
  saving.value.add(key)
  try {
    const updated = await request()
    rows.value = (rows.value ?? []).map((row) => (row.key === updated.key ? updated : row))
    return { row: updated, error: null }
  } catch (err) {
    actionError.value = `Perubahan tidak tersimpan: ${errorMessage(err)}`
    return { row: null, error: err }
  } finally {
    saving.value.delete(key)
  }
}

function toggleOnRack(tech: Tech) {
  return save(
    `tech:${tech.key}`,
    () => adminApi.updateTech(tech.key, { on_rack: !tech.on_rack }),
    techs.data,
  )
}

function toggleVisible(tech: Tech) {
  return save(
    `tech:${tech.key}`,
    () => adminApi.updateTech(tech.key, { visible: !tech.visible }),
    techs.data,
  )
}

async function saveTechLinks(tech: Tech) {
  const draft = techDrafts[tech.key] ?? {}
  const links: TechLink[] = []
  let valid = true
  for (const fit of slots(tech)) {
    const id = fieldId(tech.key, fit)
    const url = (draft[fit ?? ''] ?? '').trim()
    fieldErrors[id] = shopeeUrlError(url)
    if (fieldErrors[id]) valid = false
    links.push({ fit, url })
  }
  if (!valid) return
  const { row, error } = await save(
    `tech:${tech.key}`,
    () => adminApi.updateTech(tech.key, { links }),
    techs.data,
  )
  if (row) {
    fillTechDraft(row)
    savedNote.value = `Link ${techName(row.name)} tersimpan.`
  }
  // The backend names link fields links.<fit>, or links for the fit-less one
  if (error instanceof ApiError) {
    for (const [field, message] of Object.entries(error.fields)) {
      const fit = field === 'links' ? null : field.replace(/^links./, '')
      fieldErrors[fieldId(tech.key, fit)] = message
    }
  }
}

function toggleAvailable(collab: Collab) {
  return save(
    `collab:${collab.key}`,
    () => adminApi.updateCollab(collab.key, { available: !collab.available }),
    collabs.data,
  )
}

async function saveCollabLink(collab: Collab) {
  const id = fieldId(collab.key, null)
  const url = (collabDrafts[collab.key] ?? '').trim()
  fieldErrors[id] = shopeeUrlError(url)
  if (fieldErrors[id]) return
  const { row, error } = await save(
    `collab:${collab.key}`,
    () => adminApi.updateCollab(collab.key, { url }),
    collabs.data,
  )
  if (row) {
    collabDrafts[collab.key] = row.url ?? ''
    savedNote.value = `Link ${row.name} tersimpan.`
  }
  if (error instanceof ApiError && error.fields.url) fieldErrors[id] = error.fields.url
}
</script>

<template>
  <h1 class="text-h2">Tech dan collab</h1>
  <p class="mt-2 max-w-[60ch] text-muted">
    Perubahan terlihat di situs publik paling lama satu menit kemudian. Link hanya boleh ke
    https://shopee.co.id, kosongkan untuk menghapus link.
  </p>
  <div aria-live="assertive">
    <p v-if="actionError" class="field-error">{{ actionError }}</p>
  </div>
  <p aria-live="polite" class="mt-1 text-muted">{{ savedNote }}</p>

  <section aria-labelledby="catalog-tech" class="mt-4">
    <h2 id="catalog-tech" class="text-h3">Tech</h2>
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
        class="border-b border-line py-3"
        :data-tech="tech.key"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-h3">
            {{ techName(tech.name) }}
            <span v-if="!tech.visible" class="spec-label ml-1">Tersembunyi</span>
          </h3>
          <div class="flex flex-wrap items-center gap-2">
            <label class="check-row">
              <input
                type="checkbox"
                :checked="tech.visible"
                :aria-busy="saving.has(`tech:${tech.key}`)"
                @change="toggleVisible(tech)"
              />
              Tampil di situs
            </label>
            <button
              type="button"
              class="btn btn-secondary min-h-[44px]"
              :aria-busy="saving.has(`tech:${tech.key}`)"
              @click="toggleOnRack(tech)"
            >
              <span class="sr-only">{{ tech.name }}: </span>
              {{ tech.on_rack ? 'On the rack' : 'Belum tersedia' }}
            </button>
          </div>
        </div>

        <form
          class="mt-2 grid gap-2 md:grid-cols-2"
          novalidate
          @submit.prevent="saveTechLinks(tech)"
        >
          <FormField
            v-for="fit in slots(tech)"
            :id="fieldId(tech.key, fit)"
            :key="fit ?? ''"
            v-slot="f"
            :label="fit ? `Link Shopee ${fit}` : 'Link Shopee (tanpa fit)'"
            :error="fieldErrors[fieldId(tech.key, fit)]"
            optional
          >
            <input
              :id="fieldId(tech.key, fit)"
              v-model="techDrafts[tech.key]![fit ?? '']"
              type="url"
              inputmode="url"
              autocomplete="off"
              spellcheck="false"
              class="field-input"
              placeholder="https://shopee.co.id/..."
              :aria-describedby="f.describedby"
              :aria-invalid="f.invalid"
            />
          </FormField>
          <div class="md:col-span-2">
            <button
              type="submit"
              class="btn btn-primary"
              :aria-busy="saving.has(`tech:${tech.key}`)"
            >
              Simpan link {{ techName(tech.name) }}
            </button>
          </div>
        </form>
      </li>
    </ul>
  </section>

  <section aria-labelledby="catalog-collab" class="mt-6">
    <h2 id="catalog-collab" class="text-h3">Collab</h2>
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
        class="border-b border-line py-3"
        :data-collab="collab.key"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <h3 class="text-h3">{{ collab.name }}</h3>
          <button
            type="button"
            class="btn btn-secondary min-h-[44px]"
            :aria-busy="saving.has(`collab:${collab.key}`)"
            @click="toggleAvailable(collab)"
          >
            <span class="sr-only">{{ collab.name }}: </span>
            {{ collab.available ? 'Tersedia' : 'Coming soon' }}
          </button>
        </div>
        <form
          class="mt-2 flex flex-wrap items-end gap-2"
          novalidate
          @submit.prevent="saveCollabLink(collab)"
        >
          <FormField
            :id="fieldId(collab.key, null)"
            v-slot="f"
            class="min-w-0 flex-1 basis-[280px]"
            label="Link koleksi Shopee"
            :error="fieldErrors[fieldId(collab.key, null)]"
            optional
          >
            <input
              :id="fieldId(collab.key, null)"
              v-model="collabDrafts[collab.key]"
              type="url"
              inputmode="url"
              autocomplete="off"
              spellcheck="false"
              class="field-input"
              placeholder="https://shopee.co.id/novoidminds?shopCollection=..."
              :aria-describedby="f.describedby"
              :aria-invalid="f.invalid"
            />
          </FormField>
          <button
            type="submit"
            class="btn btn-primary"
            :aria-busy="saving.has(`collab:${collab.key}`)"
          >
            Simpan link {{ collab.name }}
          </button>
        </form>
      </li>
    </ul>
  </section>
</template>
