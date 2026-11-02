import { onMounted, ref, shallowRef } from 'vue'
import { useRoute } from 'vue-router'
import { errorMessage } from '@/api/client'
import { apiErrorText, langFromPath } from '@/i18n'

// Fetching waits for onMounted, so prerender and hydration both start in the loading state.
export function useAsync<T>(load: () => Promise<T>, options: { immediate?: boolean } = {}) {
  const immediate = options.immediate ?? true
  const data = shallowRef<T | null>(null)
  const error = ref('')
  const loading = ref(immediate)
  let latest = 0

  // Admin keeps the backend's Indonesian wording (FR-118), public pages translate the code (FR-116).
  const route = useRoute()
  const describe = (err: unknown) =>
    route.path.startsWith('/admin')
      ? errorMessage(err)
      : apiErrorText(err, langFromPath(route.path))

  async function run() {
    const current = ++latest
    loading.value = true
    error.value = ''
    try {
      const result = await load()
      if (current === latest) data.value = result
    } catch (err) {
      if (current === latest) error.value = describe(err)
    } finally {
      if (current === latest) loading.value = false
    }
  }

  if (immediate) onMounted(run)

  return { data, error, loading, run }
}
