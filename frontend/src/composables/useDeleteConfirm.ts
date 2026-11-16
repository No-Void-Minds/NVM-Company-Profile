import { ref, type Ref } from 'vue'
import { errorMessage } from '@/api/client'

// The row waiting in ConfirmDialog. error is shared with the page's other list actions.
export function useDeleteConfirm<T>(remove: (item: T) => Promise<void>) {
  const target = ref(null) as Ref<T | null>
  const error = ref('')

  async function confirm() {
    const item = target.value
    target.value = null
    if (!item) return
    error.value = ''
    try {
      await remove(item)
    } catch (err) {
      error.value = errorMessage(err)
    }
  }

  return { target, error, confirm }
}
