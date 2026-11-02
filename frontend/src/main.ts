import { createApp, createSSRApp } from 'vue'
import { createWebHistory } from 'vue-router'
import App from './App.vue'
import { createAppRouter } from './router'
import './styles/tokens.css'
import './styles/app.css'

async function start() {
  const container = document.getElementById('app')
  if (!container) return

  // A prerendered route already has markup to hydrate, the SPA shell has none.
  const hydrate = container.firstElementChild !== null
  const app = hydrate ? createSSRApp(App) : createApp(App)
  const router = createAppRouter(createWebHistory())
  app.use(router)
  await router.isReady()
  app.mount(container)
}

void start()
