import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory } from 'vue-router'
import App from './App.vue'
import { fullTitle, renderHeadTags } from './composables/useHead'
import { createAppRouter } from './router'

export async function render(url: string) {
  const app = createSSRApp(App)
  const router = createAppRouter(createMemoryHistory())
  app.use(router)
  await router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  const { title = 'No Void Minds', description = '' } = router.currentRoute.value.meta
  return {
    html,
    title: fullTitle(title),
    headTags: renderHeadTags({ title, description }),
  }
}
