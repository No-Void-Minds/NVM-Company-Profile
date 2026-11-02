<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errorMessage } from '@/api/client'
import FormField from '@/components/FormField.vue'
import { useSession } from '@/composables/useSession'

const session = useSession()
const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const error = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    await session.login(username.value.trim(), password.value)
    const next = String(route.query.next ?? '')
    // Only local admin paths, so a crafted link cannot redirect elsewhere after login.
    await router.push(next.startsWith('/admin/') ? next : '/admin')
  } catch (err) {
    error.value = errorMessage(err)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="wrap flex min-h-svh items-center justify-center py-4">
    <form class="grid w-full max-w-[400px] gap-3" @submit.prevent="submit">
      <h1 class="text-h2">Masuk admin</h1>
      <FormField id="login-username" v-slot="f" label="Username">
        <input
          id="login-username"
          v-model="username"
          class="field-input"
          autocomplete="username"
          required
          :aria-describedby="f.describedby"
        />
      </FormField>
      <FormField id="login-password" v-slot="f" label="Password">
        <input
          id="login-password"
          v-model="password"
          type="password"
          class="field-input"
          autocomplete="current-password"
          required
          :aria-describedby="f.describedby"
        />
      </FormField>
      <p v-if="error" role="alert" class="field-error">{{ error }}</p>
      <button type="submit" class="btn btn-primary" :disabled="submitting">
        {{ submitting ? 'Memeriksa' : 'Masuk ke panel admin' }}
      </button>
    </form>
  </main>
</template>
