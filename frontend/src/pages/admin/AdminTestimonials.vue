<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { adminApi, ApiError, errorMessage } from '@/api/client'
import type { AdminTestimonial, TestimonialSource } from '@/api/types'
import ConfirmDialog from '@/components/ConfirmDialog.vue'
import FormField from '@/components/FormField.vue'
import StateEmpty from '@/components/state/StateEmpty.vue'
import StateError from '@/components/state/StateError.vue'
import StateLoading from '@/components/state/StateLoading.vue'
import { techName } from '@/composables/site'
import { formatDate } from '@/i18n'
import { useAsync } from '@/composables/useAsync'

const SOURCE_LABEL: Record<TestimonialSource, string> = {
  shopee: 'Shopee',
  tiktok_shop: 'TikTok Shop',
}

const { data, error, loading, run } = useAsync(() => adminApi.testimonials())
const techs = useAsync(() => adminApi.techs().catch(() => []))
const items = computed(() => data.value ?? [])

const blank = () => ({
  source: 'shopee' as TestimonialSource,
  review_date: '',
  tech_key: '',
  rating: '' as number | '',
  transcript: '',
  blurred_confirmed: false,
  published: false,
})
const form = reactive(blank())
const editingId = ref<string | null>(null)
const file = ref<File | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const fields = ref<Record<string, string>>({})
const formError = ref('')
const saving = ref(false)
const deleting = ref<AdminTestimonial | null>(null)
const listError = ref('')

// BR-02: withdrawing the blur confirmation also withdraws publication.
watch(
  () => form.blurred_confirmed,
  (blurred) => {
    if (!blurred) form.published = false
  },
)

function resetForm() {
  Object.assign(form, blank())
  editingId.value = null
  file.value = null
  if (fileInput.value) fileInput.value.value = ''
  fields.value = {}
  formError.value = ''
}

function edit(item: AdminTestimonial) {
  resetForm()
  editingId.value = item.id
  Object.assign(form, {
    source: item.source,
    review_date: item.review_date,
    tech_key: item.tech_key ?? '',
    rating: item.rating ?? '',
    transcript: item.transcript,
    blurred_confirmed: item.blurred_confirmed,
    published: item.published,
  })
}

function onFile(event: Event) {
  file.value = (event.target as HTMLInputElement).files?.[0] ?? null
}

async function save() {
  fields.value = {}
  formError.value = ''
  if (!form.review_date) fields.value.review_date = 'Isi tanggal ulasan.'
  if (!form.transcript.trim()) fields.value.transcript = 'Transkrip wajib diisi.'
  if (!editingId.value && !file.value) fields.value.image = 'Pilih file tangkapan layar.'
  if (Object.keys(fields.value).length > 0) return

  saving.value = true
  try {
    if (editingId.value) {
      await adminApi.updateTestimonial(editingId.value, {
        source: form.source,
        review_date: form.review_date,
        tech_key: form.tech_key || null,
        rating: form.rating === '' ? null : form.rating,
        transcript: form.transcript,
        blurred_confirmed: form.blurred_confirmed,
        published: form.published,
      })
    } else {
      const body = new FormData()
      body.set('image', file.value as File)
      body.set('source', form.source)
      body.set('review_date', form.review_date)
      body.set('tech_key', form.tech_key)
      body.set('rating', String(form.rating))
      body.set('transcript', form.transcript)
      body.set('blurred_confirmed', String(form.blurred_confirmed))
      body.set('published', String(form.published))
      await adminApi.createTestimonial(body)
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

async function togglePublished(item: AdminTestimonial) {
  listError.value = ''
  try {
    await adminApi.updateTestimonial(item.id, { published: !item.published })
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
    await adminApi.deleteTestimonial(target.id)
    if (editingId.value === target.id) resetForm()
    await run()
  } catch (err) {
    listError.value = errorMessage(err)
  }
}
</script>

<template>
  <h1 class="text-h2">Testimoni</h1>

  <form
    class="mt-3 grid max-w-[800px] gap-2 border border-line p-3"
    novalidate
    @submit.prevent="save"
  >
    <h2 class="text-h3">{{ editingId ? 'Ubah testimoni' : 'Unggah tangkapan layar' }}</h2>
    <FormField
      v-if="!editingId"
      id="testimonial-image"
      v-slot="f"
      label="File tangkapan layar"
      hint="JPG, PNG, atau WebP, maksimal 8 MB."
      :error="fields.image"
    >
      <input
        id="testimonial-image"
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="field-input"
        :aria-describedby="f.describedby"
        :aria-invalid="f.invalid"
        @change="onFile"
      />
    </FormField>
    <div class="grid gap-2 sm:grid-cols-2">
      <FormField id="testimonial-source" v-slot="f" label="Sumber" :error="fields.source">
        <select
          id="testimonial-source"
          v-model="form.source"
          class="field-input"
          :aria-describedby="f.describedby"
          :aria-invalid="f.invalid"
        >
          <option value="shopee">Shopee</option>
          <option value="tiktok_shop">TikTok Shop</option>
        </select>
      </FormField>
      <FormField
        id="testimonial-date"
        v-slot="f"
        label="Tanggal ulasan"
        :error="fields.review_date"
      >
        <input
          id="testimonial-date"
          v-model="form.review_date"
          type="date"
          class="field-input"
          :aria-describedby="f.describedby"
          :aria-invalid="f.invalid"
        />
      </FormField>
      <FormField id="testimonial-tech" v-slot="f" label="Tech" optional :error="fields.tech_key">
        <select
          id="testimonial-tech"
          v-model="form.tech_key"
          class="field-input"
          :aria-describedby="f.describedby"
          :aria-invalid="f.invalid"
        >
          <option value="">Tidak disebut</option>
          <option v-for="tech in techs.data.value" :key="tech.key" :value="tech.key">
            {{ techName(tech.name) }}
          </option>
        </select>
      </FormField>
      <FormField
        id="testimonial-rating"
        v-slot="f"
        label="Rating bintang"
        optional
        hint="Isi hanya bila terlihat di tangkapan layar."
        :error="fields.rating"
      >
        <select
          id="testimonial-rating"
          v-model="form.rating"
          class="field-input"
          :aria-describedby="f.describedby"
          :aria-invalid="f.invalid"
        >
          <option value="">Tidak terlihat</option>
          <option v-for="n in 5" :key="n" :value="n">{{ n }}</option>
        </select>
      </FormField>
    </div>
    <FormField
      id="testimonial-transcript"
      v-slot="f"
      label="Transkrip"
      hint="Salin isi ulasan agar bisa dibaca screen reader dan dicari."
      :error="fields.transcript"
    >
      <textarea
        id="testimonial-transcript"
        v-model="form.transcript"
        rows="4"
        class="field-input"
        :aria-describedby="f.describedby"
        :aria-invalid="f.invalid"
      ></textarea>
    </FormField>
    <label class="check-row">
      <input v-model="form.blurred_confirmed" type="checkbox" />
      Nama dan foto pembeli sudah diburamkan
    </label>
    <p v-if="fields.blurred_confirmed" class="field-error">{{ fields.blurred_confirmed }}</p>
    <label class="check-row">
      <input v-model="form.published" type="checkbox" :disabled="!form.blurred_confirmed" />
      Publikasikan di halaman Testimoni
    </label>
    <p v-if="formError" role="alert" class="field-error">{{ formError }}</p>
    <div class="flex flex-wrap gap-2">
      <button type="submit" class="btn btn-primary" :disabled="saving">
        {{ saving ? 'Menyimpan' : editingId ? 'Simpan perubahan testimoni' : 'Unggah testimoni' }}
      </button>
      <button v-if="editingId" type="button" class="btn btn-secondary" @click="resetForm">
        Batal ubah
      </button>
    </div>
  </form>

  <p v-if="listError" role="alert" class="field-error">{{ listError }}</p>
  <StateLoading v-if="loading" label="Memuat testimoni" class="mt-4" />
  <StateError v-else-if="error" :message="error" class="mt-4" @retry="run" />
  <StateEmpty
    v-else-if="items.length === 0"
    title="Belum ada testimoni"
    message="Unggah tangkapan layar pertama lewat formulir di atas."
    class="mt-4"
  />
  <ul v-else class="mt-4 border-t border-line">
    <li
      v-for="item in items"
      :key="item.id"
      class="flex flex-wrap items-center gap-2 border-b border-line py-2"
    >
      <div class="min-w-[200px] flex-1">
        <p class="spec-label">
          {{ SOURCE_LABEL[item.source] }}, {{ formatDate(item.review_date, 'id') }},
          {{ item.published ? 'dipublikasikan' : 'draf' }},
          {{ item.blurred_confirmed ? 'sudah buram' : 'belum buram' }}
        </p>
        <p class="mt-1 line-clamp-2">{{ item.transcript }}</p>
      </div>
      <div class="flex flex-wrap gap-1">
        <button type="button" class="btn btn-secondary min-h-[44px]" @click="edit(item)">
          Ubah
        </button>
        <button
          type="button"
          class="btn btn-secondary min-h-[44px]"
          :disabled="!item.blurred_confirmed && !item.published"
          @click="togglePublished(item)"
        >
          {{ item.published ? 'Tarik dari publik' : 'Publikasikan' }}
        </button>
        <button type="button" class="btn btn-secondary min-h-[44px]" @click="deleting = item">
          Hapus
        </button>
      </div>
    </li>
  </ul>

  <ConfirmDialog
    :open="deleting !== null"
    title="Hapus testimoni ini?"
    message="Tangkapan layar dan transkripnya dihapus permanen."
    confirm-label="Hapus testimoni"
    @confirm="confirmDelete"
    @cancel="deleting = null"
  />
</template>
