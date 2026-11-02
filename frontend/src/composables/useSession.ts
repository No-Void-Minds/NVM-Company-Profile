import { ref } from 'vue'
import { adminApi, setCsrfToken } from '@/api/client'

const username = ref<string | null>(null)
let checked = false

function apply(session: { username: string; csrf_token: string } | null) {
  username.value = session?.username ?? null
  setCsrfToken(session?.csrf_token ?? '')
}

export function useSession() {
  async function ensure() {
    if (checked) return
    try {
      apply(await adminApi.me())
    } catch {
      apply(null)
    }
    checked = true
  }

  async function login(name: string, password: string) {
    apply(await adminApi.login(name, password))
    checked = true
  }

  async function logout() {
    await adminApi.logout()
    apply(null)
  }

  function clear() {
    apply(null)
  }

  return { username, ensure, login, logout, clear }
}
