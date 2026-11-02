<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { api, ApiError, errorMessage } from '@/api/client'
import type { InquiryInput, InquiryKind } from '@/api/types'
import AppButton from '@/components/AppButton.vue'
import FormField from '@/components/FormField.vue'
import IconSvg from '@/components/IconSvg.vue'
import KnitDivider from '@/components/KnitDivider.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import { validateInquiry } from '@/composables/inquiryValidation'
import { newUuid, techName, whatsappUrl } from '@/composables/site'
import { useAsync } from '@/composables/useAsync'

const PATHS: Array<{
  kind: InquiryKind
  title: string
  audience: string
  body: string
  points: string[]
  cta: string
}> = [
  {
    kind: 'wholesale',
    title: 'Wholesale',
    audience: 'Stores dan resellers',
    body: 'You run a store and want NVM on your rack. Tiered pricing on bulk orders across our systems, full size runs, and restocks you can plan around.',
    points: ['Tiered pricing', 'Full size runs', 'Reliable restocks'],
    cta: 'Isi inquiry wholesale',
  },
  {
    kind: 'collaboration',
    title: 'Collaboration',
    audience: 'Brands, communities, teams',
    body: 'You have an idea and an audience. We have the fabric. Co-branded capsules built on our material systems, with custom design and limited runs. Minimum order applies.',
    points: ['Custom design', 'Limited runs', 'Our materials'],
    cta: 'Isi inquiry collaboration',
  },
]

const form = reactive<InquiryInput>({
  kind: 'wholesale',
  name: '',
  org: '',
  city: '',
  phone: '',
  email: '',
  channels: '',
  techs: [],
  quantity_note: '',
  message: '',
  consent: false,
  website: '',
})

// Optional field, so a failed load just removes the list instead of blocking the form.
const techs = useAsync(() => api.techs().catch(() => []))

const errors = ref<Record<string, string>>({})
const submitError = ref('')
const submitting = ref(false)
const successCode = ref('')
const formSection = ref<HTMLElement | null>(null)
const successHeading = ref<HTMLElement | null>(null)

// Same content keeps the key, so a double click or a retry cannot create a second row.
let idempotencyKey: string | null = null
watch(form, () => (idempotencyKey = null), { deep: true })

const submitLabel = computed(() =>
  form.kind === 'wholesale' ? 'Kirim inquiry wholesale' : 'Kirim inquiry collaboration',
)

const successWhatsapp = computed(() =>
  whatsappUrl(`Halo NVM, saya baru mengirim inquiry B2B dengan kode ${successCode.value}.`),
)

function choosePath(kind: InquiryKind) {
  form.kind = kind
  formSection.value?.scrollIntoView({ block: 'start' })
  formSection.value?.querySelector<HTMLElement>('input[name="kind"]:checked')?.focus()
}

async function focusFirstError() {
  await nextTick()
  formSection.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
}

async function submit() {
  if (submitting.value) return
  submitError.value = ''
  errors.value = validateInquiry(form)
  if (Object.keys(errors.value).length > 0) {
    await focusFirstError()
    return
  }

  submitting.value = true
  idempotencyKey ??= newUuid()
  try {
    const result = await api.createInquiry({ ...form, techs: [...form.techs] }, idempotencyKey)
    successCode.value = result.code
    await nextTick()
    successHeading.value?.focus()
  } catch (err) {
    submitError.value = errorMessage(err)
    if (err instanceof ApiError && Object.keys(err.fields).length > 0) {
      errors.value = err.fields
      await focusFirstError()
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="wrap section">
    <SectionHeading
      level="h1"
      number="B2B"
      title="Dua jalur kerja sama"
      lead="Ceritakan kebutuhanmu lewat formulir. Tim NVM menjawab lewat WhatsApp atau email."
    />

    <div class="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
      <section
        v-for="(path, index) in PATHS"
        :key="path.kind"
        :aria-labelledby="`path-${path.kind}`"
        class="border border-line p-3 lg:p-4"
        :class="index === 0 ? 'bg-surface' : ''"
      >
        <p class="spec-label">{{ path.audience }}</p>
        <h2 :id="`path-${path.kind}`" class="mt-1 text-h2">{{ path.title }}</h2>
        <p class="mt-2 max-w-[56ch] text-muted" lang="en">{{ path.body }}</p>
        <ul class="mt-2" lang="en">
          <li v-for="point in path.points" :key="point" class="border-t border-line py-1">
            {{ point }}
          </li>
        </ul>
        <button type="button" class="btn btn-secondary mt-3" @click="choosePath(path.kind)">
          {{ path.cta }}
        </button>
      </section>
    </div>
  </div>

  <KnitDivider />

  <section ref="formSection" aria-labelledby="form-title" class="wrap section">
    <div v-if="successCode" class="max-w-[640px]">
      <h2 id="form-title" ref="successHeading" tabindex="-1" class="text-h2">Inquiry terkirim</h2>
      <p class="spec-label mt-3">Kode inquiry</p>
      <p class="mt-1 font-mono text-h2">{{ successCode }}</p>
      <p class="mt-3 text-muted">
        Simpan kode ini. Tim NVM akan menghubungi kontak yang kamu tulis, atau lanjutkan sekarang
        lewat WhatsApp.
      </p>
      <AppButton :href="successWhatsapp" class="mt-3">
        <IconSvg name="chat" />
        Lanjut chat WhatsApp
      </AppButton>
    </div>

    <template v-else>
      <h2 id="form-title" class="text-h2">Formulir inquiry</h2>
      <form class="mt-4 grid max-w-[800px] gap-3" novalidate @submit.prevent="submit">
        <fieldset>
          <legend class="field-label">Jenis kerja sama</legend>
          <div class="flex flex-wrap gap-x-4">
            <label v-for="path in PATHS" :key="path.kind" class="check-row">
              <input v-model="form.kind" type="radio" name="kind" :value="path.kind" />
              {{ path.title }}
            </label>
          </div>
        </fieldset>

        <div class="grid gap-3 md:grid-cols-2">
          <FormField id="name" v-slot="f" label="Nama" :error="errors.name">
            <input
              id="name"
              v-model="form.name"
              class="field-input"
              autocomplete="name"
              :aria-describedby="f.describedby"
              :aria-invalid="f.invalid"
            />
          </FormField>
          <FormField id="org" v-slot="f" label="Nama usaha atau komunitas" :error="errors.org">
            <input
              id="org"
              v-model="form.org"
              class="field-input"
              autocomplete="organization"
              :aria-describedby="f.describedby"
              :aria-invalid="f.invalid"
            />
          </FormField>
          <FormField id="city" v-slot="f" label="Kota" :error="errors.city">
            <input
              id="city"
              v-model="form.city"
              class="field-input"
              autocomplete="address-level2"
              :aria-describedby="f.describedby"
              :aria-invalid="f.invalid"
            />
          </FormField>
          <FormField
            id="channels"
            v-slot="f"
            label="Kanal penjualan"
            optional
            :error="errors.channels"
          >
            <input
              id="channels"
              v-model="form.channels"
              class="field-input"
              :aria-describedby="f.describedby"
              :aria-invalid="f.invalid"
            />
          </FormField>
          <FormField
            id="phone"
            v-slot="f"
            label="WhatsApp"
            hint="Isi WhatsApp atau email, salah satu cukup."
            :error="errors.phone"
          >
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              class="field-input"
              autocomplete="tel"
              :aria-describedby="f.describedby"
              :aria-invalid="f.invalid"
            />
          </FormField>
          <FormField id="email" v-slot="f" label="Email" :error="errors.email">
            <input
              id="email"
              v-model="form.email"
              type="email"
              class="field-input"
              autocomplete="email"
              :aria-describedby="f.describedby"
              :aria-invalid="f.invalid"
            />
          </FormField>
        </div>

        <fieldset v-if="(techs.data.value ?? []).length > 0">
          <legend class="field-label">
            Tech yang diminati <span class="text-muted">(opsional)</span>
          </legend>
          <div class="grid sm:grid-cols-2 lg:grid-cols-3">
            <label v-for="tech in techs.data.value" :key="tech.key" class="check-row">
              <input v-model="form.techs" type="checkbox" :value="tech.key" />
              {{ techName(tech.name) }}
            </label>
          </div>
          <p v-if="errors.techs" class="field-error">{{ errors.techs }}</p>
        </fieldset>

        <FormField
          id="quantity_note"
          v-slot="f"
          label="Perkiraan jumlah"
          optional
          :error="errors.quantity_note"
        >
          <input
            id="quantity_note"
            v-model="form.quantity_note"
            class="field-input"
            :aria-describedby="f.describedby"
            :aria-invalid="f.invalid"
          />
        </FormField>

        <FormField id="message" v-slot="f" label="Pesan" :error="errors.message">
          <textarea
            id="message"
            v-model="form.message"
            rows="5"
            class="field-input"
            :aria-describedby="f.describedby"
            :aria-invalid="f.invalid"
          ></textarea>
        </FormField>

        <!-- Hidden from people. Only bots fill it, and the backend then discards the entry. -->
        <div class="honeypot" aria-hidden="true">
          <label for="website">Website</label>
          <input
            id="website"
            v-model="form.website"
            type="text"
            name="website"
            tabindex="-1"
            autocomplete="off"
          />
        </div>

        <div>
          <label class="check-row">
            <input
              v-model="form.consent"
              type="checkbox"
              :aria-invalid="errors.consent ? 'true' : undefined"
              :aria-describedby="errors.consent ? 'consent-error' : undefined"
            />
            <span>
              Saya setuju data ini diproses untuk menjawab inquiry saya, sesuai
              <RouterLink to="/privasi" class="underline underline-offset-4">
                kebijakan privasi
              </RouterLink>
              .
            </span>
          </label>
          <p v-if="errors.consent" id="consent-error" class="field-error">{{ errors.consent }}</p>
        </div>

        <p v-if="submitError" role="alert" class="field-error">{{ submitError }}</p>

        <div>
          <AppButton type="submit" :disabled="submitting">
            {{ submitting ? 'Mengirim inquiry' : submitLabel }}
          </AppButton>
        </div>
      </form>
    </template>
  </section>
</template>

<style scoped>
.honeypot {
  position: absolute;
  left: -9999px;
  width: 1px;
  height: 1px;
  overflow: hidden;
}
</style>
