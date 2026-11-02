<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import { api, ApiError } from '@/api/client'
import type { InquiryInput, InquiryKind } from '@/api/types'
import AppButton from '@/components/AppButton.vue'
import FormField from '@/components/FormField.vue'
import IconSvg from '@/components/IconSvg.vue'
import KnitDivider from '@/components/KnitDivider.vue'
import SectionHeading from '@/components/SectionHeading.vue'
import {
  serverFieldErrors,
  validateInquiry,
  type InquiryErrorKey,
} from '@/composables/inquiryValidation'
import { newUuid, techName, whatsappUrl } from '@/composables/site'
import { useAsync } from '@/composables/useAsync'
import { apiErrorText, useI18n } from '@/i18n'

const { lang, t, to } = useI18n()

// Wholesale and Collaboration are the path names on both sites
const PATHS = computed(() =>
  (['wholesale', 'collaboration'] as const).map((kind) => ({
    kind: kind as InquiryKind,
    title: kind === 'wholesale' ? 'Wholesale' : 'Collaboration',
    ...t.value.b2b[kind],
  })),
)

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
const techs = useAsync(() => api.techs(lang.value).catch(() => []))

const errorKeys = ref<Record<string, InquiryErrorKey>>({})
const errors = computed(() =>
  Object.fromEntries(
    Object.entries(errorKeys.value).map(([field, key]) => [field, t.value.b2b.errors[key]]),
  ),
)
const submitError = ref('')
const submitting = ref(false)
const successCode = ref('')
const formSection = ref<HTMLElement | null>(null)
const successHeading = ref<HTMLElement | null>(null)

// Same content keeps the key, so a double click or a retry cannot create a second row.
let idempotencyKey: string | null = null
watch(form, () => (idempotencyKey = null), { deep: true })

const submitLabel = computed(() => t.value.b2b[form.kind].submit)

const successWhatsapp = computed(() => whatsappUrl(t.value.b2b.sentMessage(successCode.value)))

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
  errorKeys.value = validateInquiry(form)
  if (Object.keys(errorKeys.value).length > 0) {
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
    submitError.value = apiErrorText(err, lang.value)
    if (err instanceof ApiError && Object.keys(err.fields).length > 0) {
      errorKeys.value = serverFieldErrors(err.fields)
      await focusFirstError()
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="wrap section">
    <SectionHeading level="h1" number="B2B" :title="t.b2b.title" :lead="t.b2b.lead" />

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
        <p class="mt-2 max-w-[56ch] text-muted">{{ path.body }}</p>
        <ul class="mt-2">
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
      <h2 id="form-title" ref="successHeading" tabindex="-1" class="text-h2">
        {{ t.b2b.sentTitle }}
      </h2>
      <p class="spec-label mt-3">{{ t.b2b.codeLabel }}</p>
      <p class="mt-1 font-mono text-h2">{{ successCode }}</p>
      <p class="mt-3 text-muted">{{ t.b2b.sentBody }}</p>
      <AppButton :href="successWhatsapp" class="mt-3">
        <IconSvg name="chat" />
        {{ t.b2b.sentCta }}
      </AppButton>
    </div>

    <template v-else>
      <h2 id="form-title" class="text-h2">{{ t.b2b.formTitle }}</h2>
      <form class="mt-4 grid max-w-[800px] gap-3" novalidate @submit.prevent="submit">
        <fieldset>
          <legend class="field-label">{{ t.b2b.kind }}</legend>
          <div class="flex flex-wrap gap-x-4">
            <label v-for="path in PATHS" :key="path.kind" class="check-row">
              <input v-model="form.kind" type="radio" name="kind" :value="path.kind" />
              {{ path.title }}
            </label>
          </div>
        </fieldset>

        <div class="grid gap-3 md:grid-cols-2">
          <FormField id="name" v-slot="f" :label="t.b2b.name" :error="errors.name">
            <input
              id="name"
              v-model="form.name"
              class="field-input"
              autocomplete="name"
              :aria-describedby="f.describedby"
              :aria-invalid="f.invalid"
            />
          </FormField>
          <FormField id="org" v-slot="f" :label="t.b2b.org" :error="errors.org">
            <input
              id="org"
              v-model="form.org"
              class="field-input"
              autocomplete="organization"
              :aria-describedby="f.describedby"
              :aria-invalid="f.invalid"
            />
          </FormField>
          <FormField id="city" v-slot="f" :label="t.b2b.city" :error="errors.city">
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
            :label="t.b2b.channels"
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
            :label="t.b2b.phone"
            :hint="t.b2b.contactHint"
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
          <FormField id="email" v-slot="f" :label="t.b2b.email" :error="errors.email">
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
            {{ t.b2b.techs }} <span class="text-muted">{{ t.state.optional }}</span>
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
          :label="t.b2b.quantity"
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

        <FormField id="message" v-slot="f" :label="t.b2b.message" :error="errors.message">
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
              {{ t.b2b.consentBefore }}
              <RouterLink :to="to('/privasi')" class="underline underline-offset-4">
                {{ t.b2b.consentLink }}
              </RouterLink>
              .
            </span>
          </label>
          <p v-if="errors.consent" id="consent-error" class="field-error">{{ errors.consent }}</p>
        </div>

        <p v-if="submitError" role="alert" class="field-error">{{ submitError }}</p>

        <div>
          <AppButton type="submit" :disabled="submitting">
            {{ submitting ? t.b2b.sending : submitLabel }}
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
