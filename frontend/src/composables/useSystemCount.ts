import { readonly, ref } from 'vue'
import { api } from '@/api/client'

// Number of visible material systems (FR-134), read from the Lab index once per page load.
// Null until known: prerendered HTML and a failed request use wording without a number,
// so a static page never states a count that the admin has since changed.
const count = ref<number | null>(null)
let loading: Promise<void> | null = null

export function useSystemCount() {
  // The password page shows no count, and while locked the public API would only answer 401
  const passwordPage = !import.meta.env.SSR && document.querySelector('meta[name="nvm-gate"]')
  if (!import.meta.env.SSR && !loading && !passwordPage) {
    loading = api
      .labStats()
      .then((stats) => {
        count.value = stats.systems
      })
      .catch(() => {
        // Stays null and the texts keep their count-free form
        loading = null
      })
  }
  return readonly(count)
}
