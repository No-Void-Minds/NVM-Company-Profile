import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ApiError } from '@/api/client'
import { en } from './en'
import { id, type Messages } from './id'

export type Lang = 'id' | 'en'
export type { Messages, PageKey } from './id'

const DICTIONARIES: Record<Lang, Messages> = { id, en }
const EN_PREFIX = '/en'

export function messages(lang: Lang): Messages {
  return DICTIONARIES[lang]
}

// The path is the only source of the language (FR-110), never the browser setting.
export function langFromPath(path: string): Lang {
  return path === EN_PREFIX || path.startsWith(`${EN_PREFIX}/`) ? 'en' : 'id'
}

// '/en/teknologi' and '/teknologi' both become '/teknologi'
export function basePath(path: string): string {
  if (langFromPath(path) === 'id') return path
  return path.slice(EN_PREFIX.length) || '/'
}

export function localePath(path: string, lang: Lang): string {
  const base = basePath(path)
  if (lang === 'id') return base
  return base === '/' ? EN_PREFIX : `${EN_PREFIX}${base}`
}

export function apiErrorText(error: unknown, lang: Lang): string {
  const errors = messages(lang).apiErrors
  if (error instanceof ApiError && error.code in errors) {
    return errors[error.code as keyof typeof errors]
  }
  return errors.INTERNAL
}

const DATE_LOCALE: Record<Lang, string> = { id: 'id-ID', en: 'en-GB' }

export function formatDate(value: string, lang: Lang): string {
  // A bare date would parse as UTC midnight, the time part pins it to Jakarta.
  const date = new Date(value.length === 10 ? `${value}T00:00:00+07:00` : value)
  return new Intl.DateTimeFormat(DATE_LOCALE[lang], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(date)
}

export function formatNumber(value: number, lang: Lang): string {
  return value.toLocaleString(DATE_LOCALE[lang], { maximumFractionDigits: 1 })
}

export function useI18n() {
  const route = useRoute()
  const lang = computed(() => langFromPath(route.path))
  const t = computed(() => messages(lang.value))
  return {
    lang,
    t,
    // Internal links keep the visitor in the language they are reading
    to: (path: string) => localePath(path, lang.value),
  }
}
