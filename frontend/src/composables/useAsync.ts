import { onMounted, ref, shallowRef } from 'vue'
import { errorMessage } from '@/api/client'

// Fetching waits for onMounted, so prerender and hydration both start in the loading state.
export function useAsync<T>(load: () => Promise<T>, options: { immediate?: boolean } = {}) {
  const immediate = options.immediate ?? true
  const data = shallowRef<T | null>(null)
  const error = ref('')
  const loading = ref(immediate)
  let latest = 0

  async function run() {
    const current = ++latest
    loading.value = true
    error.value = ''
    try {
      const result = await load()
      if (current === latest) data.value = result
    } catch (err) {
      if (current === latest) error.value = errorMessage(err)
    } finally {
      if (current === latest) loading.value = false
    }
  }

  if (immediate) onMounted(run)

  return { data, error, loading, run }
}
