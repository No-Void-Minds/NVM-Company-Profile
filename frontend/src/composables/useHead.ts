import { watchEffect } from 'vue'
import type { RouteLocationNormalizedLoaded } from 'vue-router'
import { basePath, langFromPath, localePath, messages, type Lang } from '@/i18n'

export interface HeadMeta {
  title: string
  description: string
  lang: Lang
  // Absent for admin and 404, which have no language twin to point at
  alternates: Record<Lang, string> | null
  // Set on the password page only: its own path, read by main.ts, and noindex (FR-123)
  gatePath?: string
}

const SITE_NAME = 'No Void Minds'
const OG_LOCALE: Record<Lang, string> = { id: 'id_ID', en: 'en_US' }
// hreflang needs absolute URLs. Without the build variable they stay root relative.
const SITE_URL = ((import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined) ?? '').replace(
  /\/+$/,
  '',
)

export function fullTitle(title: string): string {
  return title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
}

// systemCount fills the count into descriptions that mention it, null keeps them count-free.
export function routeHead(
  route: RouteLocationNormalizedLoaded,
  systemCount: number | null = null,
): HeadMeta {
  const lang = langFromPath(route.path)
  const page = route.meta.page
  if (!page) {
    return {
      title: route.meta.title ?? SITE_NAME,
      description: route.meta.description ?? '',
      lang,
      alternates: null,
    }
  }
  const base = basePath(route.path)
  if (page === 'password') {
    return {
      ...messages(lang).meta[page],
      lang,
      alternates: null,
      gatePath: localePath('/password', lang),
    }
  }
  const meta = messages(lang).meta[page]
  return {
    title: meta.title,
    description:
      typeof meta.description === 'function' ? meta.description(systemCount) : meta.description,
    lang,
    alternates:
      page === 'notFound' ? null : { id: localePath(base, 'id'), en: localePath(base, 'en') },
  }
}

interface Tag {
  name: 'meta' | 'link'
  attrs: Record<string, string>
}

function headTags(meta: HeadMeta): Tag[] {
  const tags: Tag[] = [
    { name: 'meta', attrs: { name: 'description', content: meta.description } },
    { name: 'meta', attrs: { property: 'og:title', content: fullTitle(meta.title) } },
    { name: 'meta', attrs: { property: 'og:description', content: meta.description } },
    { name: 'meta', attrs: { property: 'og:type', content: 'website' } },
    { name: 'meta', attrs: { property: 'og:site_name', content: SITE_NAME } },
    { name: 'meta', attrs: { property: 'og:locale', content: OG_LOCALE[meta.lang] } },
  ]
  if (meta.alternates) {
    const other: Lang = meta.lang === 'id' ? 'en' : 'id'
    tags.push(
      { name: 'meta', attrs: { property: 'og:locale:alternate', content: OG_LOCALE[other] } },
      { name: 'link', attrs: { rel: 'canonical', href: SITE_URL + meta.alternates[meta.lang] } },
      {
        name: 'link',
        attrs: { rel: 'alternate', hreflang: 'id', href: SITE_URL + meta.alternates.id },
      },
      {
        name: 'link',
        attrs: { rel: 'alternate', hreflang: 'en', href: SITE_URL + meta.alternates.en },
      },
      // Indonesian is the default site (FR-110)
      {
        name: 'link',
        attrs: { rel: 'alternate', hreflang: 'x-default', href: SITE_URL + meta.alternates.id },
      },
    )
  }
  if (meta.gatePath) {
    tags.push(
      { name: 'meta', attrs: { name: 'robots', content: 'noindex' } },
      { name: 'meta', attrs: { name: 'nvm-gate', content: meta.gatePath } },
    )
  }
  return tags
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

// Used by the prerender step, which has no document to write into.
export function renderHeadTags(meta: HeadMeta): string {
  return headTags(meta)
    .map((tag) => {
      const attrs = Object.entries(tag.attrs)
        .map(([key, value]) => `${key}="${escapeHtml(value)}"`)
        .join(' ')
      return `<${tag.name} ${attrs} data-head />`
    })
    .join('\n    ')
}

function applyHead(meta: HeadMeta) {
  document.title = fullTitle(meta.title)
  document.documentElement.lang = meta.lang
  // Every managed tag carries data-head, so the set is replaced as a whole per route.
  for (const old of document.head.querySelectorAll('[data-head]')) old.remove()
  for (const tag of headTags(meta)) {
    const element = document.createElement(tag.name)
    for (const [key, value] of Object.entries(tag.attrs)) element.setAttribute(key, value)
    element.setAttribute('data-head', '')
    document.head.appendChild(element)
  }
}

export function useHead(source: () => HeadMeta) {
  if (import.meta.env.SSR) return
  watchEffect(() => applyHead(source()))
}
