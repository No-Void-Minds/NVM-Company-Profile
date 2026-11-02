<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { adminApi, ApiError, errorMessage } from '@/api/client'
import type { AdminGalleryItem } from '@/api/types'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import FormField from '@/components/FormField.vue'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import { useAsync } from '@/composables/useAsync'

const { data, error, loading, run } = useAsync(() => adminApi.gallery())
const items = computed(() => data.value ?? [])
const categories = computed(() => [...new Set(items.value.map((item) => item.category))])

const blank = () => ({
  category: '',
  alt: '',
  caption: '',
  alt_en: '',
  caption_en: '',
  sort: 0,
  visible: true,
})
const form = reactive(blank())
const editingId = ref<string | null>(null)
const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const fields = ref<Record<string, string>>({})
const formError = ref('')
const saving = ref(false)
const deleting = ref<AdminGalleryItem | null>(null)
const listError = ref('')

function resetForm() {
  Object.assign(form, blank())
  editingId.value = null
  file.value = null
  if (fileInput.value) fileInput.value.value = ''
  fields.value = {}
  formError.value = ''
}

function edit(item: AdminGalleryItem) {
  resetForm()
  editingId.value = item.id
  Object.assign(form, {
    category: item.category,
    alt: item.alt,
    caption: item.caption,
    alt_en: item.alt_en,
    caption_en: item.caption_en,
    sort: item.sort,
    visible: item.visible,
  })
}

function onFile(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

async function save() {
  fields.value = {}
  formError.value = ''
  if (!form.alt.trim()) fields.value.alt = 'Teks alt wajib diisi.'
  if (!form.category.trim()) fields.value.category = 'Kategori wajib diisi.'
  if (!editingId.value && !file.value) fields.value.image = 'Pilih file gambar.'
  if (Object.keys(fields.value).length > 0) return

  saving.value = true
  try {
    if (editingId.value) {
      await adminApi.updateGallery(editingId.value, { ...form })
    } else {
      const body = new FormData()
      body.set('image', file.value as File)
      body.set('category', form.category)
      body.set('alt', form.alt)
      body.set('caption', form.caption)
      body.set('alt_en', form.alt_en)
      body.set('caption_en', form.caption_en)
      body.set('sort', String(form.sort))
      body.set('visible', String(form.visible))
      await adminApi.createGallery(body)
    }
    resetForm()
    await run()
  } catch (err) {
    formError.value = errorMessage(err)
    if (err instanceof ApiError) fields.value = err.fields
  } finally {
    saving.value = false
  }
}

async function toggleVisible(item: AdminGalleryItem) {
  listError.value = ''
  try {
    await adminApi.updateGallery(item.id, { visible: !item.visible })
    await run()
  } catch (err) {
    listError.value = errorMessage(err)
  }
}

async function confirmDelete() {
  const target = deleting.value
  deleting.value = null
  if (!target) return
  listError.value = ''
  try {
    await adminApi.deleteGallery(target.id)
    if (editingId.value === target.id) resetForm()
    await run()
  } catch (err) {
    listError.value = errorMessage(err)
  }
}
</script>

<template>
  <h1 class="text-h2">Galeri</h1>

  <form
    class="mt-3 grid max-w-[800px] gap-2 border border-line p-3"
    novalidate
    @submit.prevent="save"
  >
    <h2 class="text-h3">{{ editingId ? 'Ubah foto' : 'Unggah foto' }}</h2>
    <FormField
      v-if="!editingId"
      id="gallery-image"
      v-slot="f"
      label="File gambar"
      hint="JPG, PNG, atau WebP, maksimal 8 MB."
      :error="fields.image"
    >
      <input
        id="gallery-image"
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="field-input"
        :aria-describedby="f.describedby"
        :aria-invalid="f.invalid"
        @change="onFile"
      />
    </FormField>
    <FormField id="gallery-alt" v-slot="f" label="Teks alt" :error="fields.alt">
      <input
        id="gallery-alt"
        v-model="form.alt"
        class="field-input"
        :aria-describedby="f.describedby"
        :aria-invalid="f.invalid"
      />
    </FormField>
    <div class="grid gap-2 sm:grid-cols-2">
      <FormField
        id="gallery-category"
        v-slot="f"
        label="Kategori"
        hint="Contoh: lookbook, produksi, event."
        :error="fields.category"
      >
        <input
          id="gallery-category"
          v-model="form.category"
          class="field-input"
          list="gallery-categories"
          :aria-describedby="f.describedby"
          :aria-invalid="f.invalid"
        />
        <datalist id="gallery-categories">
          <option v-for="category in categories" :key="category" :value="category"></option>
        </datalist>
      </FormField>
      <FormField id="gallery-sort" v-slot="f" label="Urutan" :error="fields.sort">
        <input
          id="gallery-sort"
          v-model.number="form.sort"
          type="number"
          class="field-input"
          :aria-describedby="f.describedby"
        />
      </FormField>
    </div>
    <FormField id="gallery-caption" v-slot="f" label="Keterangan" optional :error="fields.caption">
      <input
        id="gallery-caption"
        v-model="form.caption"
        class="field-input"
        :aria-describedby="f.describedby"
        :aria-invalid="f.invalid"
      />
    </FormField>
    <FormField
      id="gallery-alt-en"
      v-slot="f"
      label="Teks alt bahasa Inggris"
      hint="Kosong berarti situs Inggris memakai teks alt Indonesia."
      optional
      :error="fields.alt_en"
    >
      <input
        id="gallery-alt-en"
        v-model="form.alt_en"
        class="field-input"
        lang="en"
        :aria-describedby="f.describedby"
        :aria-invalid="f.invalid"
      />
    </FormField>
    <FormField
      id="gallery-caption-en"
      v-slot="f"
      label="Keterangan bahasa Inggris"
      optional
      :error="fields.caption_en"
    >
      <input
        id="gallery-caption-en"
        v-model="form.caption_en"
        class="field-input"
        lang="en"
        :aria-describedby="f.describedby"
        :aria-invalid="f.invalid"
      />
    </FormField>
    <label class="check-row">
      <input v-model="form.visible" type="checkbox" />
      Tampilkan di galeri publik
    </label>
    <p v-if="formError" role="alert" class="field-error">{{ formError }}</p>
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Menyimpan' : editingId ? 'Simpan perubahan foto' : 'Unggah foto' }}
      </button>
      <button v-if="editingId" type="button" class="btn btn-secondary" @click="resetForm">
        Batal ubah
      </button>
    </div>
  </form>

  <p v-if="listError" role="alert" class="field-error">{{ listError }}</p>
  <StateLoading v-if="loading" label="Memuat galeri" class="mt-4" />
  <StateError v-else-if="error" :message="error" class="mt-4" @retry="run" />
  <StateEmpty
    v-else-if="items.length === 0"
    title="Belum ada foto"
    message="Unggah foto pertama lewat formulir di atas."
    class="mt-4"
  />
  <ul v-else class="mt-4 border-t border-line">
    <li
      v-for="item in items"
      :key="item.id"
      class="flex flex-wrap items-center gap-2 border-b border-line py-2"
    >
      <img
        :src="`${item.image.src.replace('-960.webp', '-480.webp')}`"
        alt=""
        width="96"
        height="96"
        loading="lazy"
        class="size-12 object-cover"
      />
      <div class="min-w-[200px] flex-1">
        <p>{{ item.alt }}</p>
        <p class="spec-label">
          {{ item.category }}, urutan {{ item.sort }},
          {{ item.visible ? 'tampil' : 'tersembunyi' }}
        </p>
      </div>
      <div class="flex flex-wrap gap-1">
        <button type="button" class="btn btn-secondary min-h-[44px]" @click="edit(item)">
          Ubah
        </button>
        <button type="button" class="btn btn-secondary min-h-[44px]" @click="toggleVisible(item)">
          {{ item.visible ? 'Sembunyikan' : 'Tampilkan' }}
        </button>
        <button type="button" class="btn btn-secondary min-h-[44px]" @click="deleting = item">
          Hapus
        </button>
      </div>
    </li>
  </ul>

  <ConfirmDialog
    :open="deleting !== null"
    title="Hapus foto ini?"
    :message="`Foto dan semua ukurannya dihapus permanen: ${deleting?.alt ?? ''}`"
    confirm-label="Hapus foto"
    @confirm="confirmDelete"
    @cancel="deleting = null"
  />
</template>
