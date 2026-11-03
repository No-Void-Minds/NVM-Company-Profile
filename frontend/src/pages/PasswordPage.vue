<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'
import { adminApi, ApiError } from '@/api/client'
import AppButton from '@/components/AppButton.vue'
import BrandLogo from '@/components/BrandLogo.vue'
import FormField from '@/components/FormField.vue'
import LangToggle from '@/components/LangToggle.vue'
import ThemeToggle from '@/components/ThemeToggle.vue'
import { safeNext } from '@/composables/safeNext'
import { apiErrorText, useI18n } from '@/i18n'

const route = useRoute()
const { lang, t } = useI18n()

const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)
const usernameInput = ref<HTMLInputElement | null>(null)

const next = computed(() => safeNext(route.query.next, lang.value === 'en' ? '/en' : '/'))

async function submit() {
  if (submitting.value) return
  error.value = ''
  if (!username.value.trim() || !password.value) {
    error.value = t.value.password.required
    await nextTick()
    usernameInput.value?.focus()
    return
  }
  submitting.value = true
  try {
    await adminApi.login(username.value.trim(), password.value)
    // A full load, so Nginx serves the real page now that the session cookie exists.
    window.location.assign(next.value)
  } catch (err) {
    password.value = ''
    if (err instanceof ApiError && err.status === 401) error.value = t.value.password.wrong
    else if (err instanceof ApiError && err.status === 429)
      error.value = t.value.password.rateLimited
    else error.value = apiErrorText(err, lang.value)
    submitting.value = false
  }
}
</script>

<template>
  <div class="gate measure-grid">
    <header class="wrap flex h-8 items-center justify-between gap-2">
      <BrandLogo />
      <div class="flex items-center">
        <LangToggle />
        <ThemeToggle />
      </div>
    </header>

    <main id="main" class="wrap flex flex-1 items-center py-6">
      <section aria-labelledby="gate-title" class="gate-panel">
        <p class="spec-label">No Void Minds</p>
        <h1 id="gate-title" class="mt-2 text-h2">{{ t.password.title }}</h1>
        <p class="mt-2 text-muted">{{ t.password.lead }}</p>

        <form class="mt-4 grid gap-3" novalidate @submit.prevent="submit">
          <FormField id="gate-username" v-slot="f" :label="t.password.username">
            <input
              id="gate-username"
              ref="usernameInput"
              v-model="username"
              class="field-input"
              autocomplete="username"
              autocapitalize="none"
              spellcheck="false"
              :aria-describedby="error ? 'gate-error' : f.describedby"
              :aria-invalid="error ? 'true' : undefined"
            />
          </FormField>
          <FormField id="gate-password" v-slot="f" :label="t.password.password">
            <input
              id="gate-password"
              v-model="password"
              type="password"
              class="field-input"
              autocomplete="current-password"
              :aria-describedby="error ? 'gate-error' : f.describedby"
              :aria-invalid="error ? 'true' : undefined"
            />
          </FormField>

          <!-- Always present, so the message is announced when it appears -->
          <div aria-live="assertive">
            <p v-if="error" id="gate-error" class="field-error">{{ error }}</p>
          </div>

          <div>
            <AppButton type="submit" :disabled="submitting">
              {{ submitting ? t.password.submitting : t.password.submit }}
            </AppButton>
          </div>
        </form>
      </section>
    </main>
  </div>
</template>

<style scoped>
.gate {
  display: flex;
  min-height: 100svh;
  flex-direction: column;
}

.gate-panel {
  width: 100%;
  max-width: 480px;
  border: 1px solid var(--line);
  background: var(--surface);
  padding: 32px 24px;
}
</style>
