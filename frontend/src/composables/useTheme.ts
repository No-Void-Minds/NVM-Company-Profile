import { onMounted, ref } from 'vue'

export type Theme = 'light' | 'dark'

// The inline script in index.html reads the same key before the first paint (FR-102).
const STORAGE_KEY = 'nvm-theme'
const SWITCH_MS = 150

// Shared by the public and admin toggles. It starts light, like the prerendered HTML,
// and reads the real value after mount so hydration matches.
const theme = ref<Theme>('light')

function apply(next: Theme) {
  const root = document.documentElement
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    root.classList.add('theme-switching')
    window.setTimeout(() => root.classList.remove('theme-switching'), SWITCH_MS)
  }
  root.dataset.theme = next
  // Read after the switch, so the browser UI color always equals the new --bg (FR-105).
  const bg = getComputedStyle(root).getPropertyValue('--bg').trim()
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', bg)
  try {
    localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Storage can be blocked, the choice then lasts until reload (FR-101).
  }
  theme.value = next
}

export function useTheme() {
  onMounted(() => {
    theme.value = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
  })
  return {
    theme,
    toggle: () => apply(theme.value === 'dark' ? 'light' : 'dark'),
  }
}
