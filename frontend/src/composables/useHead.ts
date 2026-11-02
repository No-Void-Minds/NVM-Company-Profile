import { watchEffect } from 'vue'

export interface HeadMeta {
  title: string
  description: string
}

const SITE_NAME = 'No Void Minds'

export function fullTitle(title: string): string {
  return title === SITE_NAME ? title : `${title} | ${SITE_NAME}`
}

const META_TAGS: Array<{ attr: 'name' | 'property'; key: string; value: (m: HeadMeta) => string }> =
  [
    { attr: 'name', key: 'description', value: (m) => m.description },
    { attr: 'property', key: 'og:title', value: (m) => fullTitle(m.title) },
    { attr: 'property', key: 'og:description', value: (m) => m.description },
    { attr: 'property', key: 'og:type', value: () => 'website' },
    { attr: 'property', key: 'og:site_name', value: () => SITE_NAME },
    { attr: 'property', key: 'og:locale', value: () => 'id_ID' },
  ]

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')
}

// Used by the prerender step, which has no document to write into.
export function renderHeadTags(meta: HeadMeta): string {
  return META_TAGS.map(
    (tag) => `<meta ${tag.attr}="${tag.key}" content="${escapeHtml(tag.value(meta))}" />`,
  ).join('\n    ')
}

function applyHead(meta: HeadMeta) {
  document.title = fullTitle(meta.title)
  for (const tag of META_TAGS) {
    let element = document.head.querySelector<HTMLMetaElement>(`meta[${tag.attr}="${tag.key}"]`)
    if (!element) {
      element = document.createElement('meta')
      element.setAttribute(tag.attr, tag.key)
      document.head.appendChild(element)
    }
    element.content = tag.value(meta)
  }
}

export function useHead(source: () => HeadMeta) {
  if (import.meta.env.SSR) return
  watchEffect(() => applyHead(source()))
}
