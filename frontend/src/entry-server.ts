import { createSSRApp } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createMemoryHistory } from 'vue-router'
import App from './App.vue'
import { fullTitle, renderHeadTags, routeHead } from './composables/useHead'
import { createAppRouter } from './router'

export async function render(url: string) {
  const app = createSSRApp(App)
  const router = createAppRouter(createMemoryHistory())
  app.use(router)
  await router.push(url)
  await router.isReady()

  const html = await renderToString(app)
  const head = routeHead(router.currentRoute.value)
  return {
    html,
    lang: head.lang,
    title: fullTitle(head.title),
    headTags: renderHeadTags(head),
  }
}
