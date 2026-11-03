import { createApp, createSSRApp } from 'vue'
import { createWebHistory } from 'vue-router'
import App from './App.vue'
import { createAppRouter } from './router'
import './styles/tokens.css'
import './styles/app.css'

async function start() {
  const container = document.getElementById('app')
  if (!container) return

  // Nginx answers a locked address with the password page itself (status 401). The address
  // becomes /password?next=... before the router starts, so it hydrates the page that was sent.
  const gate = document.querySelector<HTMLMetaElement>('meta[name="nvm-gate"]')?.content
  if (gate && window.location.pathname !== gate) {
    const next = window.location.pathname + window.location.search + window.location.hash
    window.history.replaceState(null, '', `${gate}?next=${encodeURIComponent(next)}`)
  }

  // A prerendered route already has markup to hydrate, the SPA shell has none.
  const hydrate = container.firstElementChild !== null
  const app = hydrate ? createSSRApp(App) : createApp(App)
  const router = createAppRouter(createWebHistory())
  app.use(router)
  await router.isReady()
  app.mount(container)
}

void start()
